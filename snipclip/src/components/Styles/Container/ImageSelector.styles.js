import styled from 'styled-components';

export const SelectorWrapper = styled.div`
  width: 40%;
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 1px;
  border: solid pink 3px;
`;

export const ImageBlock = styled.div`
  text-align: center;
`;

export const ClickableImage = styled.img`
  height: 150px;
  cursor: pointer;
  border-radius: 6px;
`;

export const RadioWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

export const RadioLabel = styled.label`
  color: black;
  margin: 0;
`;

export const ModalImage = styled.img`
  width: 100%;
  height: auto;
`;