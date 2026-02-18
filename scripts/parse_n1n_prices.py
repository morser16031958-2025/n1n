import requests
import json
from pathlib import Path

def fetch_n1n_pricing():
    """
    Забираем цены из публичного API n1n.ai/v1/models (без ключа).
    Сохраняем только модели из POPULAR_MODELS.
    """
    url = "https://api.n1n.ai/v1/models"
    try:
        r = requests.get(url, timeout=15)
        r.raise_for_status()
        data = r.json().get("data", [])
    except Exception as e:
        print("Ошибка загрузки /v1/models:", e)
        return

    # Импортируем список популярных моделей
    popular = {
        "deepseek-v3.2-thinking",
        "kimi-k2.5",
        "glm-5",
        "xiaomi-mimo-2",
        "qwen-max-3",
        "deepseek-v4",
    }

    prices = {}
    for item in data:
        model_id = item.get("id", "")
        if model_id not in popular:
            continue
        pricing = item.get("pricing", {})
        prompt = pricing.get("prompt", 0)
        completion = pricing.get("completion", 0)
        prices[model_id] = {"prompt": prompt, "completion": completion}

    # Сохраняем в проект
    out_path = Path(__file__).resolve().parent.parent / "src" / "data" / "n1n_prices.json"
    out_path.parent.mkdir(exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(prices, f, indent=2, ensure_ascii=False)
    print(f"Сохранено {len(prices)} цен для n1n.ai в {out_path}")

if __name__ == "__main__":
    fetch_n1n_pricing()