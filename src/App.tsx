import { Contact } from './components/Contact'
import { FloatingWhatsApp } from './components/FloatingWhatsApp'
import { Cursor } from './components/Cursor'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Manifesto } from './components/Manifesto'
import { Preloader } from './components/Preloader'
import { Process } from './components/Process'
import { Services } from './components/Services'
import { LoaderProvider, useLoader } from './context/LoaderContext'

function Site() {
  const { isDone } = useLoader()

  return (
    <>
      <Header />
      <main aria-busy={!isDone}>
        <Hero />
        <Manifesto />
        <Services />
        <Process />
        <Contact />
      </main>
      <Footer />
      <Cursor />
      <FloatingWhatsApp />
      {!isDone && <Preloader />}
    </>
  )
}

export default function App() {
  return (
    <LoaderProvider>
      <Site />
    </LoaderProvider>
  )
}
