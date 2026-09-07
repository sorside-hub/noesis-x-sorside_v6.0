import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertCircle, ExternalLink, RotateCcw } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure pdfjs worker locally via Vite asset bundling
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

interface PdfCanvasViewerProps {
  url: string;
  title?: string;
  className?: string;
  initialPage?: number;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  url,
  title = 'Dokumen PDF',
  className = '',
  initialPage = 1,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageRendering, setPageRendering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pinch-to-zoom state & gesture references
  const [pinchFactor, setPinchFactor] = useState<number>(1.0);
  const isPinchingRef = useRef<boolean>(false);
  const touchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1.0);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const scaleRef = useRef<number>(scale);
  scaleRef.current = scale;

  // Load PDF Document
  useEffect(() => {
    if (!url) return;

    let isCancelled = false;
    setLoading(true);
    setError(null);

    const loadingTask = pdfjsLib.getDocument({
      url,
      cMapPacked: true,
    });

    loadingTask.promise
      .then((loadedPdf) => {
        if (isCancelled) return;
        setPdfDoc(loadedPdf);
        setTotalPages(loadedPdf.numPages);
        setCurrentPage(1);
        setLoading(false);
      })
      .catch((err) => {
        // Ignore deliberate aborts during unmount or rapid toggle
        if (
          isCancelled ||
          err?.name === 'AbortException' ||
          err?.message?.toLowerCase().includes('aborted')
        ) {
          return;
        }
        console.error('Failed to load PDF:', err);
        setError('Gagal memuat dokumen PDF. Berkas mungkin dibatasi atau rusak.');
        setLoading(false);
      });

    return () => {
      isCancelled = true;
      try {
        loadingTask.destroy();
      } catch {
        // ignore
      }
    };
  }, [url]);

  // Render Page to Canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    let isCancelled = false;

    const renderPage = async () => {
      try {
        setPageRendering(true);
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Cancel previous render task if still in progress
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignore
          }
        }

        // Calculate responsive scale based on container width
        const containerWidth = containerRef.current?.clientWidth || 600;
        const unscaledViewport = page.getViewport({ scale: 1 });
        // Fits comfortably within container with padding
        const autoFitScale = Math.min((containerWidth - 36) / unscaledViewport.width, 2.5);
        const effectiveScale = Math.max(0.5, autoFitScale * scale);

        const viewport = page.getViewport({ scale: effectiveScale });

        // High DPI support
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        // Explicit width and height ensures 100% proportional aspect ratio without stretching
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;

        await task.promise;
        if (!isCancelled) {
          setPageRendering(false);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Render page error:', err);
        }
        if (!isCancelled) {
          setPageRendering(false);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, currentPage, scale]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPinchFactor(1.0);
    setScale((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 3.0));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPinchFactor(1.0);
    setScale((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.6));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPinchFactor(1.0);
    setScale(1.0);
  };

  // Pinch-to-zoom & Double tap gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();

    if (e.touches.length === 2) {
      // 2 fingers: pinch to zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistRef.current = Math.hypot(dx, dy);
      pinchStartScaleRef.current = scaleRef.current;
      isPinchingRef.current = true;
      lastTapRef.current = null;
    } else if (e.touches.length === 1) {
      // 1 finger: check double tap
      const now = Date.now();
      const touch = e.touches[0];
      const tapX = touch.clientX;
      const tapY = touch.clientY;

      if (
        lastTapRef.current &&
        now - lastTapRef.current.time < 320 &&
        Math.hypot(tapX - lastTapRef.current.x, tapY - lastTapRef.current.y) < 45
      ) {
        // Verified double tap!
        lastTapRef.current = null;
        setPinchFactor(1.0);

        // If currently zoomed (> 1.05), ALWAYS reset to 100% anywhere tapped on screen
        if (scaleRef.current > 1.05) {
          setScale(1.0);
        } else {
          // If at 100%, zoom in to 1.75x
          setScale(1.75);
          // Gently scroll viewport toward tapped area
          if (viewportRef.current) {
            const rect = viewportRef.current.getBoundingClientRect();
            const relX = tapX - rect.left;
            const relY = tapY - rect.top;
            setTimeout(() => {
              if (viewportRef.current) {
                viewportRef.current.scrollTo({
                  left: relX * 0.75,
                  top: relY * 0.75,
                  behavior: 'smooth',
                });
              }
            }, 60);
          }
        }
      } else {
        lastTapRef.current = { time: now, x: tapX, y: tapY };
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();

    if (e.touches.length === 2 && touchStartDistRef.current !== null && isPinchingRef.current) {
      if (e.cancelable) e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const ratio = currentDist / touchStartDistRef.current;
      // Live GPU preview during 2-finger gesture
      setPinchFactor(ratio);
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();

    if (e.touches.length < 2) {
      if (isPinchingRef.current && touchStartDistRef.current !== null) {
        isPinchingRef.current = false;
        // Apply final scale to canvas render
        const finalScale = Math.min(Math.max(pinchStartScaleRef.current * pinchFactor, 0.6), 3.0);
        setPinchFactor(1.0);
        setScale(Number(finalScale.toFixed(2)));
      }
      touchStartDistRef.current = null;
      isPinchingRef.current = false;
    }
  }, [pinchFactor]);

  return (
    <div 
      ref={containerRef}
      data-no-swipe
      className={`pdf-canvas-container flex flex-col rounded-xl overflow-hidden bg-bg-canvas/80 border border-border-default select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* PDF Viewport Area: Starts at top-left (0,0) to completely prevent top clipping */}
      <div 
        ref={viewportRef}
        data-no-swipe
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pan-x pan-y', overscrollBehavior: 'contain' }}
        className="relative flex-1 min-h-[280px] max-h-[520px] sm:max-h-[680px] overflow-auto p-3 sm:p-6 bg-[#2b2b2e]/5 dark:bg-[#111113] custom-scrollbar"
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-text-muted text-xs bg-bg-surface/70 backdrop-blur-xs z-10">
            <Loader2 className="w-6 h-6 animate-spin text-accent-primary" />
            <span>Memuat halaman PDF...</span>
          </div>
        )}

        {error ? (
          <div className="min-h-[240px] flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-xs text-text-muted leading-relaxed">{error}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-primary hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka berkas langsung</span>
            </a>
          </div>
        ) : (
          /* Natural alignment wrapper: Centers when small, scrolls starting at (0,0) when larger */
          <div className="min-w-full min-h-full flex items-start justify-center m-auto w-max">
            <div 
              className="relative shadow-md rounded-md overflow-hidden bg-white shrink-0 my-auto origin-center select-none"
              style={{
                // pinchFactor is ONLY active during actual 2-finger pinching gesture, completely avoiding any button-zoom jumps
                transform: pinchFactor !== 1.0 ? `scale(${pinchFactor})` : undefined,
              }}
            >
              {/* No max-w-full class: width & height scale proportionally together */}
              <canvas ref={canvasRef} className="block shadow-xs" />
              {pageRendering && (
                <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-xs text-white">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PDF Control & Navigation Bar */}
      {!loading && !error && totalPages > 0 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border-subtle bg-bg-surface text-text-muted text-xs shrink-0">
          {/* Page Navigation */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentPage <= 1 || pageRendering}
              title="Halaman sebelumnya"
              className="p-1.5 rounded-lg border border-border-default bg-bg-surface hover:bg-bg-hover text-text-primary disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] font-medium text-text-primary px-1 font-mono">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentPage >= totalPages || pageRendering}
              title="Halaman berikutnya"
              className="p-1.5 rounded-lg border border-border-default bg-bg-surface hover:bg-bg-hover text-text-primary disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Controls & Gesture Info */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.6}
              title="Perkecil (-25%)"
              className="p-1.5 rounded-lg border border-border-default bg-bg-surface hover:bg-bg-hover text-text-primary disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Clickable Percentage to Reset */}
            <button
              type="button"
              onClick={handleResetZoom}
              title="Klik untuk reset zoom ke 100% (atau ketuk 2x di layar)"
              className="px-1.5 py-1 rounded-md hover:bg-bg-hover text-[11px] text-text-primary font-mono cursor-pointer transition-colors"
            >
              {Math.round(scale * 100)}%
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
              title="Perbesar (+25%)"
              className="p-1.5 rounded-lg border border-border-default bg-bg-surface hover:bg-bg-hover text-text-primary disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {scale !== 1.0 && (
              <button
                type="button"
                onClick={handleResetZoom}
                title="Reset ke ukuran pas layar"
                className="p-1.5 rounded-lg border border-border-default bg-bg-surface hover:bg-bg-hover text-accent-primary transition-colors cursor-pointer ml-0.5"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
