import base64
import json
from datetime import date
from pathlib import Path
from typing import Any

from huggingface_hub import InferenceClient
from sqlmodel import Session, delete, select

from app.core.config import get_settings
from app.models.entities import ShiftEntry, Upload, User
from app.utils.shift_codes import SHIFT_LABELS

settings = get_settings()

SYSTEM_PROMPT = """
Sei un motore di estrazione turni ospedalieri da foto reali di bacheche mensili.
Regola prioritaria: devi cercare la riga esclusiva dell'operatore usando la MATRICOLA fornita.
Non devi estrarre turni di altri colleghi, non devi mescolare più righe, non devi usare medie o inferenze di altre persone.
Procedura obbligatoria:
1. individua il mese e l'anno del foglio.
2. cerca la riga che contiene esattamente la matricola target.
3. verifica che la stessa riga sia coerente anche con nome/cognome e reparto se presenti.
4. leggi solo le celle dei giorni di quella riga.
5. restituisci i turni solo di quella riga.
Se la matricola target non è trovata con sufficiente sicurezza, restituisci found=false e shifts=[] senza inventare nulla.
Codici validi: M, P, N, S, R, ASS.
Normalizza eventuali varianti di assenza in ASS.
Rispondi solo con JSON valido.
Schema richiesto:
{
  "month_label": "marzo 2026",
  "found": true,
  "matched_employee_code": "ABC123",
  "matched_name": "Mario Rossi",
  "matched_ward": "PS",
  "confidence": 0.0,
  "shifts": [
    {"date": "2026-03-01", "shift_code": "M", "notes": null}
  ]
}
""".strip()


def _image_to_data_url(path: str) -> str:
    mime = 'image/jpeg' if path.lower().endswith(('.jpg', '.jpeg')) else 'image/png'
    encoded = base64.b64encode(Path(path).read_bytes()).decode('utf-8')
    return f'data:{mime};base64,{encoded}'


class ShiftParserService:
    def __init__(self) -> None:
        self.client = InferenceClient(api_key=settings.hf_token) if settings.hf_token else None

    def _parse_model_json(self, raw_text: str) -> dict[str, Any]:
        text = raw_text.strip()
        if text.startswith('```'):
            text = text.strip('`')
            if text.startswith('json'):
                text = text[4:].strip()
        start = text.find('{')
        end = text.rfind('}')
        if start == -1 or end == -1:
            raise ValueError(f'Output modello non interpretabile come JSON: {raw_text[:300]}')
        payload = json.loads(text[start:end + 1])
        if 'shifts' not in payload:
            raise ValueError('Il modello non ha restituito il campo shifts')
        return payload

    def parse_and_store(self, session: Session, user: User, image_path: str, original_filename: str) -> Upload:
        if not self.client:
            raise RuntimeError('HF_TOKEN non configurato nel backend.')

        completion = self.client.chat.completions.create(
            model=settings.hf_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Trova la riga della seguente persona usando prima la matricola e solo poi nome/reparto come conferma. "
                                f"Matricola target: {user.employee_code}. "
                                f"Nome completo: {user.full_name}. "
                                f"Reparto: {user.ward_name or 'non disponibile'}. "
                                "Restituisci solo JSON valido e solo i turni della riga esatta."
                            ),
                        },
                        {"type": "image_url", "image_url": {"url": _image_to_data_url(image_path)}},
                    ],
                },
            ],
            max_tokens=1800,
            temperature=0.1,
        )
        raw_text = completion.choices[0].message.content
        payload = self._parse_model_json(raw_text)

        if not payload.get('found'):
            raise ValueError(f"Matricola {user.employee_code} non trovata con confidenza sufficiente nella tabella")

        matched_code = str(payload.get('matched_employee_code', '')).strip().upper()
        if matched_code != user.employee_code.strip().upper():
            raise ValueError(
                f"Il modello ha riconosciuto la matricola {matched_code or 'N/D'} invece di {user.employee_code}. Upload annullato per sicurezza."
            )

        upload = Upload(
            user_id=user.id,
            original_filename=original_filename,
            stored_path=image_path,
            processing_status='completed',
            month_label=payload['month_label'],
            source_note=(
                f"Matricola verificata: {matched_code} · "
                f"Nome: {payload.get('matched_name', user.full_name)} · "
                f"Confidenza: {payload.get('confidence', 'n/d')}"
            ),
        )
        session.add(upload)
        session.commit()
        session.refresh(upload)

        old_uploads = session.exec(
            select(Upload).where(Upload.user_id == user.id, Upload.month_label == payload['month_label'], Upload.id != upload.id)
        ).all()
        old_ids = [u.id for u in old_uploads if u.id]
        if old_ids:
            session.exec(delete(ShiftEntry).where(ShiftEntry.upload_id.in_(old_ids)))
            for old in old_uploads:
                session.delete(old)
            session.commit()

        for item in payload['shifts']:
            code = str(item['shift_code']).upper()
            label = 'Assenza / Da verificare' if code == 'ASS' else SHIFT_LABELS.get(code, code)
            session.add(
                ShiftEntry(
                    user_id=user.id,
                    upload_id=upload.id,
                    shift_date=date.fromisoformat(item['date']),
                    shift_code=code,
                    shift_label=label,
                    notes=item.get('notes'),
                )
            )
        session.commit()
        return upload
