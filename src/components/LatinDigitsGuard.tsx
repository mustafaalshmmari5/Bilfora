"use client";

import { useEffect } from "react";

const ARABIC_DIGITS = /[٠-٩]/g;
const PERSIAN_DIGITS = /[۰-۹]/g;

function normalizeDigits(value: string) {
  return value
    .replace(ARABIC_DIGITS, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(PERSIAN_DIGITS, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/٬/g, ",")
    .replace(/٫/g, ".")
    .replace(/٪/g, "%");
}

function normalizeTextNode(node: Text) {
  const current = node.nodeValue ?? "";
  const next = normalizeDigits(current);
  if (next !== current) node.nodeValue = next;
}

function normalizeElement(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (parent && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) {
      normalizeTextNode(node as Text);
    }
    node = walker.nextNode();
  }

  if (root instanceof Element) {
    const inputs = root.matches("input") ? [root] : Array.from(root.querySelectorAll("input"));
    inputs.forEach((input) => {
      if (input instanceof HTMLInputElement && ["number", "date", "datetime-local", "time", "tel"].includes(input.type)) {
        input.lang = "en";
        input.dir = "ltr";
      }
    });
  }
}

export default function LatinDigitsGuard() {
  useEffect(() => {
    normalizeElement(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData" && mutation.target instanceof Text) {
          normalizeTextNode(mutation.target);
          continue;
        }
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Text) normalizeTextNode(node);
          else if (node instanceof Element) normalizeElement(node);
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    const onInput = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
      const next = normalizeDigits(target.value);
      if (next !== target.value) target.value = next;
    };

    document.addEventListener("input", onInput, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("input", onInput, true);
    };
  }, []);

  return null;
}
