import styled from 'styled-components';

export const ManagerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-height: 40vh;         // ✅ 최대 높이 지정
  overflow-y: auto;         // ✅ 내용 넘치면 세로 스크롤
  padding-right: 10px;      // ✅ 스크롤바 공간 살짝 여유
  /* border: solid green 3px; */
  margin: 5px;
`;
