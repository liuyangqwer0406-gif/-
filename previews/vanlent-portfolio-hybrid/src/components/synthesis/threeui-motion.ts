// Shared adaptation from MengTo/threeui Community (MIT):
// articleHeadingDecode.ts and topDockController.ts.

const DECODE_POOL = "#%&@$/\\<>*+=~ABCDEFGHKMNPRSTUVWXYZ0123456789";

type DecodeOptions = {
  duration: number;
  stagger: number;
  scrambleLength: number;
  preserveChance: number;
  tailChance: number;
};

type DockOptions = {
  proximity: number;
  spring: number;
  damping: number;
  lift: number;
  scale: number;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

export const THREEUI_DECODE_DEFAULTS: DecodeOptions = {
  duration: 560,
  stagger: 140,
  scrambleLength: 10,
  preserveChance: 0.3,
  tailChance: 0.18,
};

export const THREEUI_DOCK_DEFAULTS: DockOptions = {
  proximity: 122,
  spring: 0.19,
  damping: 0.7,
  lift: 3.5,
  scale: 0.055,
};

export function startThreeUiDecode(
  root: HTMLElement,
  options: DecodeOptions = THREEUI_DECODE_DEFAULTS,
) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const originals = new Map<Text, string>();
  const frames = new Set<number>();

  const schedule = (callback: FrameRequestCallback) => {
    const id = window.requestAnimationFrame((time) => {
      frames.delete(id);
      callback(time);
    });
    frames.add(id);
  };

  const decodeElement = (element: HTMLElement, delay: number) => {
    const nodes: Array<{ node: Text; original: string }> = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();
    while (current) {
      const text = current as Text;
      if (text.textContent?.trim()) {
        const original = text.textContent;
        originals.set(text, original);
        nodes.push({ node: text, original });
      }
      current = walker.nextNode();
    }

    if (reduced || nodes.length === 0) return;
    const total = nodes.reduce((sum, item) => sum + item.original.length, 0);
    const start = performance.now() + delay;

    const draw = (now: number) => {
      if (now < start) {
        schedule(draw);
        return;
      }

      const progress = clamp((now - start) / Math.max(1, options.duration), 0, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      let budget = Math.floor(eased * total);

      nodes.forEach(({ node, original }) => {
        const revealed = clamp(budget, 0, original.length);
        budget -= revealed;
        if (revealed >= original.length) {
          node.textContent = original;
          return;
        }

        let output = original.slice(0, revealed);
        const scrambleLength = Math.min(original.length - revealed, Math.round(options.scrambleLength));
        for (let index = 0; index < scrambleLength; index += 1) {
          const character = original[revealed + index];
          output += character === " " || Math.random() < options.preserveChance
            ? character
            : DECODE_POOL[(Math.random() * DECODE_POOL.length) | 0];
        }
        output += original
          .slice(revealed + scrambleLength)
          .replace(/\S/g, (character) => Math.random() < options.tailChance
            ? DECODE_POOL[(Math.random() * DECODE_POOL.length) | 0]
            : character);
        node.textContent = output;
      });

      if (progress < 1) schedule(draw);
    };

    schedule(draw);
  };

  root.querySelectorAll<HTMLElement>("[data-threeui-decode]").forEach((element, index) => {
    decodeElement(element, index * options.stagger);
  });

  return () => {
    frames.forEach(window.cancelAnimationFrame);
    originals.forEach((original, node) => {
      node.textContent = original;
    });
  };
}

export function createThreeUiDockController(
  root: HTMLElement,
  getOptions: () => DockOptions = () => THREEUI_DOCK_DEFAULTS,
) {
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const precisionQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const items = Array.from(root.querySelectorAll<HTMLElement>("[data-threeui-dock-item]")).map((element) => ({
    element,
    center: 0,
    value: 0,
    velocity: 0,
    target: 0,
  }));
  let frame = 0;

  const canAnimate = () => !reducedQuery.matches && precisionQuery.matches && window.innerWidth > 700;
  const renderItem = (item: (typeof items)[number]) => {
    const options = getOptions();
    const value = clamp(item.value, 0, 1.08);
    item.element.style.transform = `translate3d(0, ${(value * options.lift).toFixed(2)}px, 0) scale(${(1 + value * options.scale).toFixed(4)})`;
    item.element.dataset.near = value > 0.08 ? "true" : "false";
  };
  const stop = () => {
    window.cancelAnimationFrame(frame);
    frame = 0;
  };
  const resetImmediately = () => {
    stop();
    items.forEach((item) => {
      item.value = 0;
      item.velocity = 0;
      item.target = 0;
      item.element.style.transform = "";
      item.element.dataset.near = "false";
    });
  };
  const draw = () => {
    frame = 0;
    if (!canAnimate()) {
      resetImmediately();
      return;
    }

    const options = getOptions();
    let moving = false;
    items.forEach((item) => {
      item.velocity += (item.target - item.value) * options.spring;
      item.velocity *= options.damping;
      item.value += item.velocity;
      if (Math.abs(item.target - item.value) < 0.001 && Math.abs(item.velocity) < 0.001) {
        item.value = item.target;
        item.velocity = 0;
      } else {
        moving = true;
      }
      renderItem(item);
    });
    if (moving) frame = window.requestAnimationFrame(draw);
  };
  const schedule = () => {
    if (!frame) frame = window.requestAnimationFrame(draw);
  };
  const measure = () => {
    if (!canAnimate()) {
      resetImmediately();
      return;
    }
    items.forEach((item) => {
      const rect = item.element.getBoundingClientRect();
      item.center = rect.left + rect.width * 0.5;
    });
  };
  const reset = () => {
    items.forEach((item) => { item.target = 0; });
    schedule();
  };
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || !canAnimate()) return;
    const options = getOptions();
    items.forEach((item) => {
      const proximity = clamp(1 - Math.abs(event.clientX - item.center) / options.proximity, 0, 1);
      item.target = proximity * proximity * (3 - 2 * proximity);
    });
    schedule();
  };
  const onFocusIn = (event: FocusEvent) => {
    const focused = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-threeui-dock-item]");
    const focusedIndex = items.findIndex((item) => item.element === focused);
    if (focusedIndex < 0 || !canAnimate()) return;
    items.forEach((item, index) => {
      item.target = index === focusedIndex ? 1 : Math.abs(index - focusedIndex) === 1 ? 0.24 : 0;
    });
    schedule();
  };
  const onFocusOut = () => window.requestAnimationFrame(() => {
    if (!root.contains(document.activeElement)) reset();
  });

  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(root);
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerleave", reset);
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("focusout", onFocusOut);
  reducedQuery.addEventListener("change", measure);
  precisionQuery.addEventListener("change", measure);
  measure();

  return () => {
    resetImmediately();
    resizeObserver.disconnect();
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerleave", reset);
    root.removeEventListener("focusin", onFocusIn);
    root.removeEventListener("focusout", onFocusOut);
    reducedQuery.removeEventListener("change", measure);
    precisionQuery.removeEventListener("change", measure);
  };
}
