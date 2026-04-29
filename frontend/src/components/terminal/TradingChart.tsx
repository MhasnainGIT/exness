// src/components/TradingChart.tsx
import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  CrosshairMode,
  PriceLineSource,
  Time,
  LineSeries
} from 'lightweight-charts';

export interface ChartProps {
  data: {
    time: string | number;
    open: number;
    high: number;
    low: number;
    close: number
  }[];
  livePrice?: {
    time: number;
    bid: number;
    ask: number
  };
  positions?: any[];
  timeframe?: '1M' | '1H';
  colors?: {
    backgroundColor?: string;
    textColor?: string;
    upColor?: string;
    downColor?: string;
    borderUpColor?: string;
    borderDownColor?: string;
    wickUpColor?: string;
    wickDownColor?: string;
  };
}

export const TradingChart = forwardRef<any, ChartProps>((props, ref) => {
  const {
    data,
    livePrice,
    positions = [],
    timeframe = '1H',
    colors: _colors
  } = props;

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const ema20Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const ema50Ref = useRef<ISeriesApi<"Line"> | null>(null);
  const priceLinesRef = useRef<any[]>([]);

  const colors = {
    backgroundColor: '#0c0d10',
    textColor: '#848e9c',
    upColor: '#1e75e4',        // Exness blue
    downColor: '#cf304a',      // Exness red
    borderUpColor: '#1e75e4',
    borderDownColor: '#cf304a',
    wickUpColor: '#1e75e4',
    wickDownColor: '#cf304a',
    ..._colors,
  };

  // Initialize Chart - Runs Only Once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: {
          type: ColorType.Solid,
          color: colors.backgroundColor
        },
        textColor: colors.textColor,
      },
      grid: {
        vertLines: { color: 'rgba(43, 47, 54, 0.15)' },
        horzLines: { color: 'rgba(43, 47, 54, 0.15)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderVisible: false,
        rightOffset: 12,
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.08,
          bottom: 0.08,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#848e9c',
          width: 1,
          style: 2,
          labelVisible: true
        },
        horzLine: {
          color: '#848e9c',
          width: 1,
          style: 2,
          labelVisible: true
        },
      },
      handleScroll: {
        vertTouchDrag: true,
        horzTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: colors.upColor,
      downColor: colors.downColor,
      borderVisible: false,
      wickUpColor: colors.wickUpColor,
      wickDownColor: colors.wickDownColor,
      priceLineVisible: false,
      priceLineSource: PriceLineSource.LastVisible,
    });

    const ema20 = chart.addSeries(LineSeries, {
      color: '#ffce00',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const ema50 = chart.addSeries(LineSeries, {
      color: '#1e75e4',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;
    ema20Ref.current = ema20;
    ema50Ref.current = ema50;

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });

    resizeObserver.observe(chartContainerRef.current);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []); // Empty dependency - runs once

  // Update Historical Candles
  useEffect(() => {
    if (!seriesRef.current) return;
    
    if (data.length === 0) {
      try { seriesRef.current.setData([]); } catch(e) {}
      return;
    }

    const uniqueMap = new Map<number, any>();

    data.forEach(d => {
      let timeVal: number;
      if (typeof d.time === 'string') {
        timeVal = Math.floor(new Date(d.time).getTime() / 1000);
      } else {
        timeVal = d.time > 10000000000
          ? Math.floor(d.time / 1000)
          : d.time;
      }

      uniqueMap.set(timeVal, {
        time: timeVal as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      });
    });

    const sortedData = Array.from(uniqueMap.values())
      .sort((a, b) => (a.time as number) - (b.time as number));

    seriesRef.current.setData(sortedData);

    // Calculate Indicators
    if (sortedData.length > 50) {
      const calculateEMA = (items: any[], period: number) => {
        const k = 2 / (period + 1);
        let ema = items.slice(0, period).reduce((acc, val) => acc + val.close, 0) / period;
        return items.slice(period).map(item => {
          ema = (item.close - ema) * k + ema;
          return { time: item.time, value: ema };
        });
      };

      ema20Ref.current?.setData(calculateEMA(sortedData, 20));
      ema50Ref.current?.setData(calculateEMA(sortedData, 50));
    }

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data]);

  // Live Price Update (Real-time Candle)
  const activeCandleRef = useRef<any>(null);

  useEffect(() => {
    activeCandleRef.current = null;
  }, [timeframe]);

  useEffect(() => {
    if (!seriesRef.current || !livePrice || data.length === 0) return;

    const lastCandle = data[data.length - 1];
    if (!lastCandle) return;

    const lastTime = typeof lastCandle.time === 'string'
      ? Math.floor(new Date(lastCandle.time).getTime() / 1000)
      : lastCandle.time;

    const liveTime = Math.floor(livePrice.time / 1000);
    const tfSeconds = timeframe === '1M' ? 60 : 3600;
    const barTime = Math.floor(liveTime / tfSeconds) * tfSeconds;

    const targetTime = Math.max(lastTime, barTime);

    if (!activeCandleRef.current || activeCandleRef.current.time !== targetTime) {
      activeCandleRef.current = {
        time: targetTime as Time,
        open: targetTime === lastTime ? lastCandle.open : livePrice.bid,
        high: targetTime === lastTime ? lastCandle.high : livePrice.bid,
        low: targetTime === lastTime ? lastCandle.low : livePrice.bid,
        close: targetTime === lastTime ? lastCandle.close : livePrice.bid,
      };
    }

    const current = activeCandleRef.current;

    // Bulletproof safety against frontend processing 0 or wild ticks
    if (!livePrice.bid || isNaN(livePrice.bid) || livePrice.bid <= 0) return;
    if (Math.abs(livePrice.bid - current.open) / current.open > 0.10) return;

    current.high = Math.max(current.high, livePrice.bid);
    current.low = Math.min(current.low, livePrice.bid);
    current.close = livePrice.bid;

    try {
      seriesRef.current.update(current);
    } catch (e) {
      console.error('Chart live update error:', e);
    }
  }, [livePrice, data, timeframe]);

  // Position Price Lines
  useEffect(() => {
    if (!seriesRef.current) return;

    // Clear previous price lines
    priceLinesRef.current.forEach(line => {
      try {
        seriesRef.current?.removePriceLine(line);
      } catch (e) { }
    });
    priceLinesRef.current = [];

    // Add new price lines for open positions
    positions.forEach((pos, index) => {
      const entryPrice = parseFloat(pos.entryPrice || pos.openPrice || 0);
      if (!entryPrice) return;

      const line = seriesRef.current?.createPriceLine({
        price: entryPrice,
        color: pos.side === 'BUY' ? '#1e75e4' : '#d6344d',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: `${pos.side} ${parseFloat(pos.volumeLots || 0).toFixed(2)}`,
      });

      if (line) priceLinesRef.current.push(line);
    });
  }, [positions]);

  // Expose methods to parent components (Terminal & DrawingLayer)
  useImperativeHandle(ref, () => ({
    toggleGrid: (visible: boolean) => {
      if (chartRef.current) {
        chartRef.current.applyOptions({
          grid: {
            vertLines: { visible },
            horzLines: { visible },
          },
        });
      }
    },

    timeToCoordinate: (time: number) => {
      return chartRef.current?.timeScale().timeToCoordinate(time as any);
    },

    coordinateToTime: (x: number) => {
      return chartRef.current?.timeScale().coordinateToTime(x);
    },

    priceToCoordinate: (price: number) => {
      return seriesRef.current?.priceToCoordinate(price);
    },

    coordinateToPrice: (y: number) => {
      return seriesRef.current?.coordinateToPrice(y);
    },

    autoFit: () => {
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    },

    getChart: () => chartRef.current,
    getSeries: () => seriesRef.current,
  }));

  return (
    <div
      ref={chartContainerRef}
      className="absolute inset-0 w-full h-full"
      style={{
        backgroundColor: colors.backgroundColor
      }}
    />
  );
});

TradingChart.displayName = 'TradingChart';