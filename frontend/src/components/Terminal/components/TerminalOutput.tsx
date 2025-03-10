import React, { forwardRef } from 'react';
import { TerminalOutputProps } from '../types';
import * as S from '../styles';

/**
 * Terminal çıktısı bileşeni
 */
const TerminalOutput = forwardRef<HTMLDivElement, TerminalOutputProps>(
  ({ output, formatTime }, ref) => {
    return (
      <S.TerminalOutputContainer ref={ref}>
        {output.length === 0 ? (
          <div style={{ color: '#e2e8f0', padding: '4px 0' }}>
            open position with command
            <br /><br />
            e.g. L btc 10000
          </div>
        ) : (
          output.map((item, index) => (
            <S.OutputLine key={index}>
              {item.timestamp && (
                <span style={{ color: '#8f9bba', marginRight: '8px', fontSize: '11px' }}>{formatTime(item.timestamp)}</span>
              )}
              {item.type === 'user' ? (
                <S.CommandLine>$ {item.content}</S.CommandLine>
              ) : (
                <S.ResultLine success={item.success}>{item.content}</S.ResultLine>
              )}
            </S.OutputLine>
          ))
        )}
      </S.TerminalOutputContainer>
    );
  }
);

TerminalOutput.displayName = 'TerminalOutput';

export default TerminalOutput; 