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

html = html.replace('<link rel="stylesheet" href="style.css">', f"<style>{css}</style>")
html = html.replace('<script src="app.js"></script>', f"<script>{javascript}</script>")

components.html(html, height=1200, scrolling=True)
