/**
 * Chart.js
 * 
 * Grafik bileşeni.
 * Dinamik olarak yüklenir (kod bölme).
 */

import { useState, useEffect } from 'react';

const Chart = ({ symbol, interval, data }) => {
  const [chartData, setChartData] = useState([]);
  
  useEffect(() => {
    if (data && data.length > 0) {
      // Veriyi grafik için uygun formata dönüştür
      const formattedData = data.map((item) => ({
        time: new Date(parseInt(item.openTime)).getTime(),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume),
      }));
      
      setChartData(formattedData);
    }
  }, [data]);
  
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>{symbol} Fiyat Grafiği ({interval})</h3>
      </div>
      
      <div className="chart-content">
        {chartData.length > 0 ? (
          <div className="chart">
            <div className="chart-placeholder">
              <p>Grafik burada gösterilecek</p>
              <p>Bu bileşen, gerçek bir grafik kütüphanesi (örn. TradingView, Recharts) ile değiştirilebilir</p>
              <div className="chart-data">
                <div className="chart-bars">
                  {chartData.map((item, index) => (
                    <div 
                      key={index} 
                      className={`chart-bar ${item.close > item.open ? 'positive' : 'negative'}`}
                      style={{ 
                        height: `${Math.min(100, Math.max(10, (item.high - item.low) * 1000))}px`,
                        marginLeft: index > 0 ? '10px' : '0'
                      }}
                    >
                      <div className="chart-candle" 
                        style={{ 
                          top: `${(item.high - item.close) * 1000}px`,
                          height: `${Math.abs(item.close - item.open) * 1000}px`
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="chart-loading">Veri yükleniyor...</div>
        )}
      </div>
      
      <style jsx>{`
        .chart-container {
          width: 100%;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 1rem;
        }
        
        .chart-header {
          padding: 1rem;
          background-color: #f9f9f9;
          border-bottom: 1px solid #eaeaea;
        }
        
        .chart-header h3 {
          margin: 0;
          font-size: 1.2rem;
        }
        
        .chart-content {
          padding: 1rem;
          height: 400px;
          position: relative;
        }
        
        .chart {
          width: 100%;
          height: 100%;
        }
        
        .chart-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: #666;
        }
        
        .chart-data {
          width: 100%;
          height: 200px;
          margin-top: 1rem;
          position: relative;
          overflow-x: auto;
        }
        
        .chart-bars {
          display: flex;
          align-items: flex-end;
          height: 100%;
          padding: 0 1rem;
        }
        
        .chart-bar {
          width: 10px;
          position: relative;
          background-color: #f0f0f0;
        }
        
        .chart-candle {
          position: absolute;
          width: 100%;
        }
        
        .positive .chart-candle {
          background-color: #00c853;
        }
        
        .negative .chart-candle {
          background-color: #ff3d00;
        }
        
        .chart-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default Chart; 