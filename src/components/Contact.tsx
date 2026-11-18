import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { contact, sections } from '../data/content'
import { useClock } from '../hooks/useClock'
import { REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery'
import { Button } from './Button'
import { RollText } from './RollText'
import { SectionMeta } from './SectionMeta'
import styles from './Contact.module.css'

const WA_NUMBER = contact.whatsapp.replace('https://wa.me/', '')

export function Contact() {
  const nameInputRef = useRef<HTMLInputElement>(null)
  const msgRef = useRef<HTMLTextAreaElement>(null)
  const revealRef = useRef<HTMLDivElement>(null)
  const reduced = useMediaQuery(REDUCED_MOTION)

  const [name, setName] = useState('')
  const [projectType, setProjectType] = useState('')
  const [budget, setBudget] = useState('')
  const [message, setMessage] = useState('')
  const [nameError, setNameError] = useState('')
  const [messageError, setMessageError] = useState('')
  const [copied, setCopied] = useState(false)
  const [liveMsg, setLiveMsg] = useState('')

  const maringaTime = useClock('America/Sao_Paulo', { seconds: false })
  const tokyoTime = useClock('Asia/Tokyo', { seconds: false })

  // auto-resize textarea
  useEffect(() => {
    const ta = msgRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [message])

  // reveal animation (once, same pattern as Services)
  useEffect(() => {
    const el = revealRef.current
    if (!el) return
    if (reduced) { el.setAttribute('data-revealed', ''); return }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        el.setAttribute('data-revealed', '')
        io.disconnect()
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contact.email)
      setCopied(true)
      setLiveMsg('E-mail copiado!')
      setTimeout(() => { setCopied(false); setLiveMsg('') }, 2000)
    } catch {
      // clipboard pode estar indisponível (ex.: HTTP sem permissão); ignora silenciosamente
    }
  }

  const buildText = () =>
    [
      `Olá! Sou ${name.trim()}.`,
      `Projeto: ${projectType || 'a definir'}.`,
      `Orçamento: ${budget || 'a definir'}.`,
      '',
      message.trim(),
    ].join('\n')

  const handleSend = () => {
    const nameOk = !!name.trim()
    const msgOk = !!message.trim()

    setNameError(nameOk ? '' : 'Por favor, informe seu nome.')
    setMessageError(msgOk ? '' : 'Por favor, escreva sua mensagem.')

    if (!nameOk) { nameInputRef.current?.focus(); return }
    if (!msgOk)  { msgRef.current?.focus(); return }

    const text = buildText()
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  const mailtoHref = `mailto:${contact.email}?subject=${encodeURIComponent(`Novo projeto — ${projectType || 'a definir'}`)}&body=${encodeURIComponent(buildText())}`

  // Canais sem href são decorativos (ex.: futura entrada de Instagram sem link)
  const channels = contact.channels.filter((ch) => ch.href)

  return (
    <section id="contato" className={styles.section} data-tone="dark">
      <div className={`container-wide ${styles.inner}`}>
        <SectionMeta
          index={sections.contato}
          label={contact.label}
          aside={contact.aside}
          tone="dark"
        />

        {/* Título com pílula estática */}
        <h2 className={styles.title} aria-label="Vamos construir algo juntos?">
          <span className={styles.titleLight}>{contact.title[0].text}</span>
          {' '}
          <span className={styles.pill} aria-hidden="true">
            <span className={styles.pillBody}>和</span>
          </span>
          <br />
          <span className={styles.titleHeavy}>{contact.title[1].text}</span>
        </h2>

        {/* Conteúdo revelado */}
        <div ref={revealRef} className={styles.body}>
          {/* Coluna esquerda: canais + relógios */}
          <div className={styles.left}>
            <p className={styles.lead} style={{ '--i': 0 } as CSSProperties}>
              {contact.lead}
            </p>

            <ul className={styles.channels}>
              {channels.map((ch, i) => (
                <li
                  key={ch.label}
                  className={styles.channel}
                  style={{ '--i': i + 1 } as CSSProperties}
                >
                  <a
                    href={ch.href}
                    target={ch.href.startsWith('http') ? '_blank' : undefined}
                    rel={ch.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    data-cursor="hover"
                    className={styles.channelLink}
                  >
                    <span className={styles.channelLabel}>{ch.label}</span>
                    <span className={styles.channelValue}>
                      <RollText>{ch.value}</RollText>
                    </span>
                    <span className={styles.channelArrow} aria-hidden="true">↗</span>
                  </a>
                  {ch.copy && (
                    <button
                      type="button"
                      className={styles.copyBtn}
                      onClick={handleCopy}
                    >
                      {copied ? 'Copiado ✓' : 'Copiar'}
                    </button>
                  )}
                </li>
              ))}
            </ul>

            <div
              className={styles.clocks}
              style={{ '--i': channels.length + 1 } as CSSProperties}
            >
              <span className={styles.clock}>
                MARINGÁ <span className={styles.clockTime}>{maringaTime}</span>
              </span>
              <span className={styles.clock}>
                TÓQUIO <span className={styles.clockTime}>{tokyoTime}</span>
              </span>
            </div>
          </div>

          {/* Coluna direita: formulário */}
          <form
            className={styles.form}
            onSubmit={(e: FormEvent) => { e.preventDefault(); handleSend() }}
            noValidate
          >
            {/* Nome */}
            <div className={styles.field} style={{ '--i': 1 } as CSSProperties}>
              <label className={styles.fieldLabel} htmlFor="contact-name">
                Nome
              </label>
              <input
                ref={nameInputRef}
                id="contact-name"
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-required="true"
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? 'contact-name-error' : undefined}
                autoComplete="name"
              />
              {nameError && (
                <span id="contact-name-error" className={styles.fieldError} role="alert">
                  {nameError}
                </span>
              )}
            </div>

            {/* Tipo de projeto */}
            <fieldset className={styles.fieldset} style={{ '--i': 2 } as CSSProperties}>
              <legend className={styles.fieldLabel}>Tipo de projeto</legend>
              <div className={styles.chips}>
                {contact.projectTypes.map((type) => (
                  <label key={type} className={styles.chip}>
                    <input
                      type="radio"
                      name="project-type"
                      value={type}
                      checked={projectType === type}
                      onChange={(e) => setProjectType(e.target.value)}
                      className={styles.chipInput}
                    />
                    <span className={styles.chipLabel}>{type}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Orçamento */}
            <fieldset className={styles.fieldset} style={{ '--i': 3 } as CSSProperties}>
              <legend className={styles.fieldLabel}>Orçamento estimado</legend>
              <div className={styles.chips}>
                {contact.budgets.map((b) => (
                  <label key={b} className={styles.chip}>
                    <input
                      type="radio"
                      name="budget"
                      value={b}
                      checked={budget === b}
                      onChange={(e) => setBudget(e.target.value)}
                      className={styles.chipInput}
                    />
                    <span className={styles.chipLabel}>{b}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Mensagem */}
            <div className={styles.field} style={{ '--i': 4 } as CSSProperties}>
              <label className={styles.fieldLabel} htmlFor="contact-message">
                Mensagem
              </label>
              <textarea
                id="contact-message"
                ref={msgRef}
                className={`${styles.input} ${styles.textarea}`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                aria-required="true"
                aria-invalid={messageError ? true : undefined}
                aria-describedby={messageError ? 'contact-message-error' : undefined}
              />
              {messageError && (
                <span id="contact-message-error" className={styles.fieldError} role="alert">
                  {messageError}
                </span>
              )}
            </div>

            {/* Enviar */}
            <div className={styles.submitRow} style={{ '--i': 5 } as CSSProperties}>
              <Button as="button" type="submit" variant="primary">
                Enviar pelo WhatsApp ↗
              </Button>
              <a href={mailtoHref} className={styles.mailtoLink}>
                Prefere e-mail?
              </a>
            </div>
          </form>
        </div>

        {/* aria-live para o botão Copiar */}
        <span aria-live="polite" className={styles.srOnly}>{liveMsg}</span>
      </div>
    </section>
  )
}
