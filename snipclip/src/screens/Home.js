import React from 'react'
import { Container } from '../components/Styles/Container/Container.style'
import { Header, MainHeader } from '../components/Styles/Header/Header.style'
import KeywordInput from '../components/KeywordInput'
import KeywordInputCopy from '../components/KeywordInputCopy'


export const Home = () => {
  return (
    <Container>
      <Header>
        <MainHeader>
          {/* <KeywordInput /> */}
          <KeywordInputCopy />
        </MainHeader>
      </Header>
    </Container>
  )
}
