import json
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components


st.set_page_config(
    page_title="Shree Siddhi Vinayak Youth Association",
    layout="wide",
    initial_sidebar_state="collapsed",
)

base_dir = Path(__file__).parent
html = (base_dir / "index.html").read_text(encoding="utf-8")
css = (base_dir / "style.css").read_text(encoding="utf-8")
javascript = (base_dir / "app.js").read_text(encoding="utf-8")

# Dynamically inject from Streamlit secrets if configured in Streamlit Cloud
try:
    if hasattr(st, "secrets") and "apiKey" in st.secrets:
        secrets_config = {
            "apiKey": str(st.secrets.get("apiKey", "")),
            "authDomain": str(st.secrets.get("authDomain", "")),
            "projectId": str(st.secrets.get("projectId", "")),
            "storageBucket": str(st.secrets.get("storageBucket", "")),
            "messagingSenderId": str(st.secrets.get("messagingSenderId", "")),
            "appId": str(st.secrets.get("appId", "")),
            "measurementId": str(st.secrets.get("measurementId", "")),
        }
        # Replace the hardcoded FIREBASE_CONFIG with secrets
        injected_js = f"const FIREBASE_CONFIG = {json.dumps(secrets_config, indent=2)};"
        import re
        javascript = re.sub(
            r'const FIREBASE_CONFIG = \{[\s\S]*?\};',
            injected_js,
            javascript,
            count=1
        )
except Exception as e:
    pass

html = html.replace('<link rel="stylesheet" href="style.css">', f"<style>{css}</style>")
html = html.replace('<script src="app.js"></script>', f"<script>{javascript}</script>")

components.html(html, height=1200, scrolling=True)

