def map_incident_type(category: str) -> str:
    category = category.lower().strip()

    mapping = {
        "begal": "BEGAL",
        "pembegalan": "BEGAL",

        "kebakaran": "KEBAKARAN",

        "kecelakaan": "KECELAKAAN",
        "tabrakan": "KECELAKAAN",

        "tawuran": "TAWURAN",

        "pencurian": "PENCURIAN",
        "curanmor": "PENCURIAN",

        "pembacokan": "PEMBACOKAN",
        "dibacok": "PEMBACOKAN",

        "lainnya": "LAINNYA",
    }

    return mapping.get(category, "LAINNYA")