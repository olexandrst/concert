# Кабінет студента (прототип)

Інтерактивний прототип особистого кабінету студента вигаданого університету «Політех-Дніпро».
Вхід приймає будь-яку пару логіну й пароля. Оформлення — за дизайн-системою Metinvest Digital.

Розділи: Головна, Розклад, Успішність, Дисципліни, Оплата, Документи, Профіль.

Файли — це Design-полотно (Claude Artifacts):

- `project/canvas.json` — індекс полотна;
- `project/Main.dc.html` — єдиний артборд із усім застосунком;
- `project/ds/metinvest-digital/tokens.json` — копія токенів дизайн-системи;
- `web/index.html` і `web/dc-lite.js` — легкий рантайм, що запускає `Main.dc.html` як звичайний сайт.

Опубліковане полотно: https://claude.ai/artifact/RMceFvMHE82ayrcL9yQaDi (приватне).

## Публікація на GitHub Pages

Сайт збирає `scripts/build-site.sh` (копіює `web/*` і `project/Main.dc.html` у `_site/`),
а `.github/workflows/pages.yml` публікує його при кожному пуші в `main` або в
`claude/jolly-maxwell-mqr5vh`. Адреса: https://olexandrst.github.io/concert/

Одноразове налаштування: Settings → Pages → Build and deployment → Source: **GitHub Actions**.

Локальний запуск: `bash scripts/build-site.sh _site && python3 -m http.server -d _site 8000`.
