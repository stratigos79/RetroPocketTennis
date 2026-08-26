(() => {
  const get = id => document.getElementById(id);
  const send = (key, code = "") => window.dispatchEvent(
    new KeyboardEvent("keydown", {key, code, bubbles:true})
  );

  const bind = (id, key, code="") => {
    const el = get(id);
    if (!el) return;
    el.onclick = null;
    el.addEventListener("pointerdown", ev => {
      ev.preventDefault();
      send(key, code);
    }, {passive:false});
  };

  bind("hit", " ", "Space");
  bind("up", "ArrowUp");
  bind("down", "ArrowDown");
  bind("start", "Enter");
  bind("gameA", "a");
  bind("gameB", "b");

  // Keep pause/reset as direct web controls.
  const pause = get("pause");
  if (pause) {
    pause.addEventListener("pointerdown", ev => {
      ev.preventDefault();
      if (typeof window.paused !== "undefined") window.paused = !window.paused;
    }, {passive:false});
  }
  const reset = get("reset");
  if (reset) {
    reset.addEventListener("pointerdown", ev => {
      ev.preventDefault();
      location.reload();
    }, {passive:false});
  }
})();