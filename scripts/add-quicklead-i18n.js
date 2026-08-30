/**
 * Idempotent: adds the QuickLead / QuickContact namespaces to messages/*.json.
 * Run with --dry to preview. Existing keys are never overwritten.
 */
const fs = require('node:fs')
const path = require('node:path')

const DRY = process.argv.includes('--dry')
const dirArg = process.argv.find((a) => a.startsWith('--dir='))
const dir = path.resolve(dirArg ? dirArg.slice('--dir='.length) : 'messages')

const T = {
  en: {
    QuickLead: {
      badge: 'Free · no obligation',
      heading: 'Get a tailored offer within 1 hour',
      body: 'Leave your phone number and we will call back with a shortlist that matches your budget, with real prices and availability.',
      phonePlaceholder: 'Your phone number',
      namePlaceholder: 'Name (optional)',
      submit: 'Get the offer',
      submitting: 'Sending…',
      successTitle: 'Request received',
      successBody: 'We will call you back within an hour during working hours.',
      error: 'Could not send. Please try again or write to us on Telegram.',
      consent: 'By submitting you agree to be contacted about your request.',
    },
    QuickContact: {
      open: 'Contact us',
      close: 'Close contacts',
      callbackAction: 'Request a call',
      formHeading: 'Get an offer within 1 hour',
      formBody: 'Leave your number — we will call you back.',
      channel: {
        telegram: 'Write on Telegram',
        whatsapp: 'Write on WhatsApp',
        phone: 'Call us',
        email: 'Send an email',
      },
    },
  },
  ru: {
    QuickLead: {
      badge: 'Бесплатно · ни к чему не обязывает',
      heading: 'Получить коммерческое предложение за 1 час',
      body: 'Оставьте номер — перезвоним и пришлём подборку под ваш бюджет: реальные цены и что действительно свободно.',
      phonePlaceholder: 'Ваш телефон',
      namePlaceholder: 'Имя (необязательно)',
      submit: 'Получить предложение',
      submitting: 'Отправляем…',
      successTitle: 'Заявка принята',
      successBody: 'Перезвоним в течение часа в рабочее время.',
      error: 'Не удалось отправить. Попробуйте ещё раз или напишите нам в Telegram.',
      consent: 'Отправляя форму, вы соглашаетесь на связь по вашему запросу.',
    },
    QuickContact: {
      open: 'Связаться с нами',
      close: 'Закрыть контакты',
      callbackAction: 'Заказать звонок',
      formHeading: 'Предложение за 1 час',
      formBody: 'Оставьте номер — мы перезвоним.',
      channel: {
        telegram: 'Написать в Telegram',
        whatsapp: 'Написать в WhatsApp',
        phone: 'Позвонить',
        email: 'Написать на почту',
      },
    },
  },
  uk: {
    QuickLead: {
      badge: 'Безкоштовно · ні до чого не зобовʼязує',
      heading: 'Отримати комерційну пропозицію за 1 годину',
      body: 'Залиште номер — передзвонимо й надішлемо добірку під ваш бюджет: реальні ціни та що справді вільне.',
      phonePlaceholder: 'Ваш телефон',
      namePlaceholder: "Імʼя (необовʼязково)",
      submit: 'Отримати пропозицію',
      submitting: 'Надсилаємо…',
      successTitle: 'Заявку прийнято',
      successBody: 'Передзвонимо протягом години в робочий час.',
      error: 'Не вдалося надіслати. Спробуйте ще раз або напишіть нам у Telegram.',
      consent: 'Надсилаючи форму, ви погоджуєтесь на звʼязок щодо вашого запиту.',
    },
    QuickContact: {
      open: 'Звʼязатися з нами',
      close: 'Закрити контакти',
      callbackAction: 'Замовити дзвінок',
      formHeading: 'Пропозиція за 1 годину',
      formBody: 'Залиште номер — ми передзвонимо.',
      channel: {
        telegram: 'Написати в Telegram',
        whatsapp: 'Написати у WhatsApp',
        phone: 'Зателефонувати',
        email: 'Написати на пошту',
      },
    },
  },
  sq: {
    QuickLead: {
      badge: 'Falas · pa asnjë detyrim',
      heading: 'Merrni një ofertë të personalizuar brenda 1 ore',
      body: 'Lini numrin tuaj — ju kthejmë përgjigje me një përzgjedhje sipas buxhetit tuaj, me çmime reale dhe çfarë është vërtet e lirë.',
      phonePlaceholder: 'Numri juaj i telefonit',
      namePlaceholder: 'Emri (opsional)',
      submit: 'Merr ofertën',
      submitting: 'Po dërgohet…',
      successTitle: 'Kërkesa u pranua',
      successBody: 'Ju kontaktojmë brenda një ore gjatë orarit të punës.',
      error: 'Dërgimi dështoi. Provoni sërish ose na shkruani në Telegram.',
      consent: 'Duke dërguar formularin, pranoni të kontaktoheni për kërkesën tuaj.',
    },
    QuickContact: {
      open: 'Na kontaktoni',
      close: 'Mbyll kontaktet',
      callbackAction: 'Kërko telefonatë',
      formHeading: 'Ofertë brenda 1 ore',
      formBody: 'Lini numrin — ju kthejmë telefonatë.',
      channel: {
        telegram: 'Na shkruani në Telegram',
        whatsapp: 'Na shkruani në WhatsApp',
        phone: 'Na telefononi',
        email: 'Na dërgoni email',
      },
    },
  },
  it: {
    QuickLead: {
      badge: 'Gratis · senza impegno',
      heading: 'Ricevi una proposta su misura entro 1 ora',
      body: 'Lascia il tuo numero: ti richiamiamo con una selezione adatta al tuo budget, con prezzi reali e disponibilità effettiva.',
      phonePlaceholder: 'Il tuo numero di telefono',
      namePlaceholder: 'Nome (facoltativo)',
      submit: 'Ricevi la proposta',
      submitting: 'Invio in corso…',
      successTitle: 'Richiesta ricevuta',
      successBody: 'Ti richiamiamo entro un’ora durante l’orario di lavoro.',
      error: 'Invio non riuscito. Riprova o scrivici su Telegram.',
      consent: 'Inviando il modulo acconsenti a essere contattato per la tua richiesta.',
    },
    QuickContact: {
      open: 'Contattaci',
      close: 'Chiudi contatti',
      callbackAction: 'Richiedi una chiamata',
      formHeading: 'Proposta entro 1 ora',
      formBody: 'Lascia il numero: ti richiamiamo.',
      channel: {
        telegram: 'Scrivici su Telegram',
        whatsapp: 'Scrivici su WhatsApp',
        phone: 'Chiamaci',
        email: 'Scrivici una email',
      },
    },
  },
  pl: {
    QuickLead: {
      badge: 'Bezpłatnie · bez zobowiązań',
      heading: 'Otrzymaj ofertę w ciągu 1 godziny',
      body: 'Zostaw numer telefonu — oddzwonimy z zestawieniem dopasowanym do Twojego budżetu, z realnymi cenami i dostępnością.',
      phonePlaceholder: 'Twój numer telefonu',
      namePlaceholder: 'Imię (opcjonalnie)',
      submit: 'Odbierz ofertę',
      submitting: 'Wysyłanie…',
      successTitle: 'Zgłoszenie przyjęte',
      successBody: 'Oddzwonimy w ciągu godziny w godzinach pracy.',
      error: 'Nie udało się wysłać. Spróbuj ponownie lub napisz do nas na Telegramie.',
      consent: 'Wysyłając formularz, zgadzasz się na kontakt w sprawie zgłoszenia.',
    },
    QuickContact: {
      open: 'Skontaktuj się z nami',
      close: 'Zamknij kontakty',
      callbackAction: 'Zamów rozmowę',
      formHeading: 'Oferta w ciągu 1 godziny',
      formBody: 'Zostaw numer — oddzwonimy.',
      channel: {
        telegram: 'Napisz na Telegramie',
        whatsapp: 'Napisz na WhatsAppie',
        phone: 'Zadzwoń do nas',
        email: 'Wyślij e-mail',
      },
    },
  },
}

let touched = 0
for (const [locale, namespaces] of Object.entries(T)) {
  const file = path.join(dir, `${locale}.json`)
  if (!fs.existsSync(file)) {
    console.log(`skip ${locale}.json — not present in this working tree`)
    continue
  }
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  let changed = false
  for (const [ns, value] of Object.entries(namespaces)) {
    if (json[ns]) {
      console.log(`keep ${locale}.${ns} — already defined`)
      continue
    }
    json[ns] = value
    changed = true
    console.log(`add  ${locale}.${ns}`)
  }
  if (changed && !DRY) {
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8')
    touched++
  }
}
console.log(DRY ? '\n(dry run — nothing written)' : `\nwrote ${touched} file(s)`)
