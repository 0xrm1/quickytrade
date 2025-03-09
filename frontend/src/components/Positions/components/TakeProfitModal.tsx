import React from 'react';
import styled from 'styled-components';
import { TakeProfitModalProps } from '../types';
import InfoModal from './InfoModal';

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  background-color: #2a2e3e;
  border: 1px solid #3a3f56;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #5a75f6;
  }
`;

const SubmitButton = styled.button`
  background-color: #5a75f6;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 10px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  position: relative;
  overflow: hidden;
  
  &:hover {
    background-color: #4a65e6;
  }
  
  &:active {
    transform: scale(0.97);
  }
`;

const TakeProfitModal: React.FC<TakeProfitModalProps> = ({ show, symbol, currentPrice, onClose, onSubmit }) => {
  if (!show) return null;
  
  return (
    <InfoModal show={show} title={`Add Take Profit for ${symbol}`} onClose={onClose}>
      <Form onSubmit={onSubmit}>
        <FormGroup>
          <Label>Current Price: {currentPrice}</Label>
        </FormGroup>
        <FormGroup>
          <Label htmlFor="takeProfitPrice">Take Profit Price</Label>
          <Input 
            id="takeProfitPrice"
            name="takeProfitPrice"
            type="number"
            step="0.0001"
            required
          />
        </FormGroup>
        <SubmitButton type="submit">Add Take Profit</SubmitButton>
      </Form>
    </InfoModal>
  );
};

export default TakeProfitModal; 