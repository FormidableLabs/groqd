type Range = [number, number];
type Op = (v: number) => number;

function animate(duration: number, ops: Op[] = []) {
  const loop = (cb: (v: number) => void, start: number) => {
    const delta = performance.now() - start;

    if (delta > duration) return;

    const p = progress(delta, [0, duration]);
    cb(ops.reduce((acc, op) => op(acc), p));
    requestAnimationFrame(() => loop(cb, start));
  };

  return {
    pipe: (op: Op) => {
      return animate(duration, [...ops, op]);
    },
    start: (cb: (v: number) => void) => {
      loop(cb, performance.now());
    },
  };
}

function clamp(v: number, range: Range) {
  return Math.min(Math.max(range[0], v), range[1]);
}

function lerp(progress: number, range: Range) {
  return (1 - progress) * range[0] + progress * range[1];
}

function progress(v: number, range: Range) {
  return (v - range[0]) / (range[1] - range[0]);
}

function ease(t: number) {
  return -Math.pow(2, -10 * t) + 1;
}

export default class Abacus {
  animation = animate(600).pipe(ease);
  bounds: number[] | null = null;
  container: HTMLElement | null = null;
  containerRect: DOMRectReadOnly | null = null;
  dividerWidth = 18;
  initialSectionCssWidth: string | null = null;
  listeners: Set<(bounds: number[]) => void> = new Set();
  numDividers: number | null = null;
  observer: ResizeObserver | null = null;

  constructor({
    dividers,
    dividerWidth,
  }: {
    dividers: number;
    dividerWidth?: number;
  }) {
    if (dividerWidth) this.dividerWidth = dividerWidth;
    this.numDividers = dividers;
    const numSections = dividers + 1;
    this.initialSectionCssWidth = `calc(${(1 / numSections) * 100}% - ${
      this.dividerWidth * (this.numDividers / numSections)
    }px)`;
  }

  boundToRealWorldSpace = (boundIndex: number) => {
    return lerp(this.bounds[boundIndex], [
      this.containerRect.left,
      this.containerRect.right,
    ]);
  };

  createEvenSplitBounds = () => {
    // numBounds = numDividers + frameLeft + frameRight
    const numBounds = this.numDividers + 2;

    // bounds represented by array of x coord normalized by containerRect.width
    return Array.from({ length: numBounds }, (_, boundIndex) => {
      if (boundIndex === 0) return 0;

      const numSections = this.numDividers + 1;
      const sectionWidth =
        (1 - this.numDividers * this.getNormalizedDividerWidth()) / numSections;

      return sectionWidth * boundIndex;
    });
  };

  emitBoundChange = () => {
    this.listeners.forEach((listener) => listener(this.bounds));
  };

  expand = (sectionIndex: number) => {
    const leftBoundIndex = sectionIndex;
    const leftDividerIndex = leftBoundIndex - 1;
    const leftDividerRange: Range = [
      this.boundToRealWorldSpace(leftBoundIndex),
      0,
    ];

    const rightBoundIndex = sectionIndex + 1;
    const rightDividerIndex = rightBoundIndex - 1;
    const rightDividerRange: Range = [
      this.boundToRealWorldSpace(rightBoundIndex),
      this.containerRect.right,
    ];

    this.animation.start((p) => {
      this.updateDivider(leftDividerIndex, lerp(p, leftDividerRange));
      this.updateDivider(rightDividerIndex, lerp(p, rightDividerRange));
    });
  };

  reset = () => {
    const evenSplitBounds = this.createEvenSplitBounds();
    const dividerRanges = this.bounds.map(
      (bound, i) => [bound, evenSplitBounds[i]] as Range
    );

    this.animation.start((p) => {
      this.bounds = dividerRanges.map((dividerRange) => lerp(p, dividerRange));
      this.emitBoundChange();
    });
  };

  getNormalizedBoundRange = (): Range => {
    return [0, 1 - this.getNumDividers() * this.getNormalizedDividerWidth()];
  };

  getNormalizedDividerWidth = () => {
    return progress(this.dividerWidth, [0, this.containerRect?.width || 1200]);
  };

  getNormalizedSectionWidth = (sectionIndex: number) => {
    const lbi = sectionIndex;
    const rbi = sectionIndex + 1;

    return clamp(
      this.bounds[rbi] - this.bounds[lbi],
      this.getNormalizedBoundRange()
    );
  };

  getNumDividers = () => {
    return this.bounds.length - 2;
  };

  onBoundChange = (listener: (bounds?: number[]) => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  setContainer = <T extends HTMLElement>(el: T | null) => {
    // instanciate
    if (!this.observer) {
      this.observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          this.containerRect = entry.contentRect;
          if (!this.bounds) {
            this.setInitialBounds();
          }
        }
      });
    }

    // cleanup
    if (this.container) this.observer.unobserve(this.container);

    // update
    if (!el) return;
    this.container = el;
    this.observer.observe(this.container);
  };

  setInitialBounds = () => {
    this.bounds = this.createEvenSplitBounds();
  };

  updateDivider = (dividerIndex: number, clientX: number) => {
    if (!this.bounds) {
      this.setInitialBounds();
    }

    if (0 > dividerIndex || dividerIndex > this.numDividers - 1) return;

    const p =
      progress(clientX, [this.containerRect.left, this.containerRect.right]) -
      dividerIndex * this.getNormalizedDividerWidth();

    // update bound
    const boundIndex = dividerIndex + 1;
    const clampedBound = clamp(p, this.getNormalizedBoundRange());
    this.bounds[boundIndex] = clampedBound;

    // ensure bounds don't intersect, but persist update
    this.bounds = this.bounds.map((bound, i, arr) => {
      if (0 >= i || i >= arr.length - 1) return bound;
      if (boundIndex === i) return bound;

      const lbi = i - 1;
      const rbi = i + 1;

      return clamp(bound, [arr[lbi], arr[rbi]]);
    });

    this.emitBoundChange();
  };
}
