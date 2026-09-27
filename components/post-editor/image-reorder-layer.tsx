"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-react";

// Lets the user drag images (or use the floating buttons) to move them between the
// blocks of a contentEditable post body. Only top-level blocks move, so an image can
// never be dropped inside a paragraph, list, or table.

type Rect = { top: number; left: number; width: number; height: number };

const EDITOR_ATTRS = ["draggable", "contenteditable", "data-quasar-image"];

function topLevelBlock(editor: HTMLElement, node: Node | null): HTMLElement | null {
  let el: Node | null = node;
  while (el && el.parentNode !== editor) el = el.parentNode;
  return el instanceof HTMLElement ? el : null;
}

// Turns every image into its own top-level <figure> block so it can be moved.
function normalizeImages(editor: HTMLElement) {
  editor.querySelectorAll("img").forEach((img) => {
    let figure = img.closest("figure");
    if (!figure || !editor.contains(figure)) {
      const block = topLevelBlock(editor, img);
      figure = document.createElement("figure");
      figure.className = "wp-block-image";
      if (block && block !== img && (block.textContent || "").trim() === "" && block.querySelectorAll("img").length === 1) {
        block.replaceWith(figure);
      } else if (block && block !== img) {
        block.after(figure);
      } else {
        img.replaceWith(figure);
      }
      figure.appendChild(img);
    }
    // A figure nested inside another block is lifted to the top level.
    const block = topLevelBlock(editor, figure);
    if (block && block !== figure) block.after(figure);
    figure.setAttribute("draggable", "true");
    figure.setAttribute("contenteditable", "false");
    figure.setAttribute("data-quasar-image", "");
  });
}

// Removes the editing-only attributes before the HTML is saved.
export function stripImageEditorAttrs(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;
  container.querySelectorAll("[data-quasar-image]").forEach((el) => {
    EDITOR_ATTRS.forEach((attr) => el.removeAttribute(attr));
  });
  return container.innerHTML;
}

export function ImageReorderLayer({ editorRef, active }: { editorRef: RefObject<HTMLDivElement | null>; active: boolean }) {
  const [hovered, setHovered] = useState<HTMLElement | null>(null);
  const [hoverRect, setHoverRect] = useState<Rect | null>(null);
  const [dropLine, setDropLine] = useState<Rect | null>(null);
  const dragging = useRef<HTMLElement | null>(null);
  const dropTarget = useRef<{ block: HTMLElement; before: boolean } | null>(null);

  const measure = useCallback((el: HTMLElement | null) => {
    if (!el) { setHoverRect(null); return; }
    const r = el.getBoundingClientRect();
    setHoverRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!active || !editor) return;
    normalizeImages(editor);

    // New images (Image button, paste) get normalized as they appear.
    const observer = new MutationObserver(() => {
      if (dragging.current) return;
      const unmanaged = Array.from(editor.querySelectorAll("img")).some((img) => !img.closest("[data-quasar-image]"));
      if (unmanaged) normalizeImages(editor);
    });
    observer.observe(editor, { childList: true, subtree: true });

    const onMouseOver = (e: MouseEvent) => {
      const fig = (e.target as HTMLElement).closest?.("[data-quasar-image]") as HTMLElement | null;
      if (fig && editor.contains(fig)) { setHovered(fig); measure(fig); }
    };

    const onDragStart = (e: DragEvent) => {
      const fig = (e.target as HTMLElement).closest?.("[data-quasar-image]") as HTMLElement | null;
      if (!fig || !editor.contains(fig)) return;
      dragging.current = fig;
      fig.style.opacity = "0.4";
      e.dataTransfer?.setData("text/x-quasar-image", "1");
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    };

    const onDragOver = (e: DragEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      const blocks = Array.from(editor.children) as HTMLElement[];
      if (!blocks.length) return;
      // Nearest block by vertical distance, so gaps between blocks still resolve.
      let best = blocks[0];
      let bestDist = Infinity;
      for (const block of blocks) {
        const r = block.getBoundingClientRect();
        const dist = e.clientY < r.top ? r.top - e.clientY : e.clientY > r.bottom ? e.clientY - r.bottom : 0;
        if (dist < bestDist) { bestDist = dist; best = block; }
      }
      const r = best.getBoundingClientRect();
      const before = e.clientY < r.top + r.height / 2;
      dropTarget.current = { block: best, before };
      const editorRect = editor.getBoundingClientRect();
      setDropLine({ top: (before ? r.top : r.bottom) - 2, left: editorRect.left, width: editorRect.width, height: 4 });
    };

    const finishDrag = () => {
      if (dragging.current) dragging.current.style.opacity = "";
      dragging.current = null;
      dropTarget.current = null;
      setDropLine(null);
    };

    const onDrop = (e: DragEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      const fig = dragging.current;
      const target = dropTarget.current;
      if (target && target.block !== fig) {
        if (target.before) target.block.before(fig);
        else target.block.after(fig);
      }
      finishDrag();
      setHovered(fig);
      measure(fig);
    };

    const onScroll = () => setHovered((current) => { measure(current); return current; });

    editor.addEventListener("mouseover", onMouseOver);
    editor.addEventListener("dragstart", onDragStart);
    editor.addEventListener("dragover", onDragOver);
    editor.addEventListener("drop", onDrop);
    editor.addEventListener("dragend", finishDrag);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      observer.disconnect();
      editor.removeEventListener("mouseover", onMouseOver);
      editor.removeEventListener("dragstart", onDragStart);
      editor.removeEventListener("dragover", onDragOver);
      editor.removeEventListener("drop", onDrop);
      editor.removeEventListener("dragend", finishDrag);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      setHovered(null);
      setHoverRect(null);
    };
  }, [active, editorRef, measure]);

  const move = (dir: -1 | 1) => {
    const fig = hovered;
    if (!fig) return;
    const sibling = (dir < 0 ? fig.previousElementSibling : fig.nextElementSibling) as HTMLElement | null;
    if (!sibling) return;
    if (dir < 0) sibling.before(fig);
    else sibling.after(fig);
    measure(fig);
    fig.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  const remove = () => {
    hovered?.remove();
    setHovered(null);
    setHoverRect(null);
  };

  if (!active) return null;

  return (
    <>
      {hovered && hoverRect && hoverRect.height > 0 && (
        <div
          className="fixed z-[110] flex items-center gap-1 rounded-lg border border-slate-300 bg-white/95 p-1 shadow-lg"
          style={{ top: Math.max(8, hoverRect.top + 8), left: hoverRect.left + 8 }}
        >
          <span className="flex cursor-grab items-center gap-1 px-1.5 text-[11px] font-semibold text-slate-500" title="Drag the image to move it">
            <GripVertical className="size-3.5" /> Drag
          </span>
          <button type="button" className="grid size-7 place-items-center rounded text-slate-600 hover:bg-fuchsia-50 hover:text-fuchsia-700" title="Move up" onClick={() => move(-1)}>
            <ArrowUp className="size-3.5" />
          </button>
          <button type="button" className="grid size-7 place-items-center rounded text-slate-600 hover:bg-fuchsia-50 hover:text-fuchsia-700" title="Move down" onClick={() => move(1)}>
            <ArrowDown className="size-3.5" />
          </button>
          <button type="button" className="grid size-7 place-items-center rounded text-red-500 hover:bg-red-50" title="Remove image" onClick={remove}>
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
      {dropLine && (
        <div className="pointer-events-none fixed z-[110] rounded-full bg-fuchsia-500" style={{ top: dropLine.top, left: dropLine.left, width: dropLine.width, height: dropLine.height }} />
      )}
    </>
  );
}
