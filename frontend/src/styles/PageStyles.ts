import styled from 'styled-components';

// Ortak sayfa stilleri
export const PageContainer = styled.div`
  background-color: #1b2839;
  min-height: 100vh;
  color: #fff;
  display: flex;
  flex-direction: column;
  padding: 20px;
`;

export const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 20px;
  background-color: #1b2839;
  border-radius: 8px;
  border: 1px solid #2c3142;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(215, 251, 115, 0.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 8px;
    border: 1px solid rgba(215, 251, 115, 0.1);
    pointer-events: none;
  }
`;

export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #2c3142;
`;

export const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
`;

export const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
`;

export const PrimaryButton = styled.button`
  background-color: transparent;
  color: #ffffff;
  border: 1px solid #d7fb73;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

export const SecondaryButton = styled.button`
  background-color: transparent;
  color: #ffffff;
  border: 1px solid #d7fb73;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

export const DangerButton = styled.button`
  background-color: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: rgba(239, 68, 68, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

// Form stilleri
export const FormContainer = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding: 24px;
  background-color: #1b2839;
  border-radius: 8px;
  border: 1px solid #2c3142;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(215, 251, 115, 0.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 8px;
    border: 1px solid rgba(215, 251, 115, 0.1);
    pointer-events: none;
  }
`;

export const FormTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 20px 0;
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(215, 251, 115, 0.2);
`;

export const FormGroup = styled.div`
  margin-bottom: 16px;
`;

export const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
`;

export const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #2c3142;
  background-color: #1b2839;
  color: white;
  font-size: 14px;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #d7fb73;
    box-shadow: 0 0 0 1px rgba(215, 251, 115, 0.3);
  }
  
  &::placeholder {
    color: #4a5568;
  }
`;

export const FormButton = styled.button`
  width: 100%;
  padding: 10px 12px;
  background-color: transparent;
  color: #ffffff;
  border: 1px solid #d7fb73;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 16px;
  
  &:hover {
    background-color: rgba(215, 251, 115, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:disabled {
    border-color: #4a5568;
    color: #8f9bba;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

export const FormFooter = styled.div`
  margin-top: 24px;
  text-align: center;
  color: #8f9bba;
  font-size: 14px;
  line-height: 1.5;
  
  a {
    color: #ffffff;
    text-decoration: none;
    font-weight: 500;
    border-bottom: 1px dashed rgba(215, 251, 115, 0.5);
    transition: all 0.2s;
    
    &:hover {
      color: #d7fb73;
      border-bottom-color: #d7fb73;
    }
  }
`;

export const ErrorMessage = styled.div`
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
`;

export const SuccessMessage = styled.div`
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
`;

// Card stilleri
export const Card = styled.div`
  background-color: #1b2839;
  border-radius: 8px;
  border: 1px solid #2c3142;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(215, 251, 115, 0.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 8px;
    border: 1px solid rgba(215, 251, 115, 0.1);
    pointer-events: none;
  }
`;

export const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(215, 251, 115, 0.2);
`;

export const CardContent = styled.div`
  color: #8f9bba;
  font-size: 14px;
`;

// Grid stilleri
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-top: 24px;
`;

// Link stilleri
export const StyledLink = styled.a`
  color: #6c8dff;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

export const FormLink = styled.a`
  color: #d7fb73;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`; 