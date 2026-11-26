// Validadores de campos (documentos, contato, endereço, veículo)

const DDDsValidos = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46',
  '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99',
])

export function validarCPF(valor) {
  const cpf = String(valor ?? '').replace(/\D/g, '')

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf))
    return false

  let soma = 0

  for (let i = 0; i < 9; i++)
    soma += Number(cpf[i]) * (10 - i)

  let digito = (soma * 10) % 11
  if (digito === 10) digito = 0

  if (digito !== Number(cpf[9]))
    return false

  soma = 0

  for (let i = 0; i < 10; i++)
    soma += Number(cpf[i]) * (11 - i)

  digito = (soma * 10) % 11
  if (digito === 10) digito = 0

  return digito === Number(cpf[10])
}

export function validarCNPJ(valor) {
  const cnpj = String(valor ?? '').replace(/\D/g, '')

  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj))
    return false

  const calcularDigito = (base, pesos) => {
    const soma = base.split('').reduce(
      (total, numero, indice) => total + Number(numero) * pesos[indice],
      0
    )

    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const primeiro = calcularDigito(cnpj.substring(0, 12), [
    5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2
  ])

  const segundo = calcularDigito(cnpj.substring(0, 12) + primeiro, [
    6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2
  ])

  return cnpj.endsWith(`${primeiro}${segundo}`)
}

export function validarEmail(valor) {
  const email = String(valor ?? '').trim()

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

export function validarTelefone(valor) {
  let telefone = String(valor ?? '').replace(/\D/g, '')

  if (telefone.startsWith('55') && (telefone.length === 12 || telefone.length === 13))
    telefone = telefone.substring(2)

  if (telefone.length !== 10 && telefone.length !== 11)
    return false

  const ddd = telefone.substring(0, 2)

  if (!DDDsValidos.has(ddd))
    return false

  if (telefone.length === 11 && telefone[2] !== '9')
    return false

  return true
}

export function validarCEP(valor) {
  return /^\d{8}$/.test(String(valor ?? '').replace(/\D/g, ''))
}

// Remove tudo que não for dígito e corta no tamanho máximo (se informado)
export function somenteDigitos(valor, max) {
  const d = String(valor ?? '').replace(/\D/g, '')
  return max ? d.slice(0, max) : d
}

// Aceita CPF (11 dígitos) ou CNPJ (14 dígitos)
export function validarCpfCnpj(valor) {
  const d = somenteDigitos(valor)
  return d.length === 11 ? validarCPF(d) : validarCNPJ(d)
}

// RG não tem padrão nacional: aceita de 5 a 13 caracteres, só dígitos,
// podendo terminar com X (dígito verificador de alguns estados)
export function validarRG(valor) {
  const rg = String(valor ?? '').replace(/[.\-\s/]/g, '').toUpperCase()
  return /^\d{4,12}[\dX]$/.test(rg) && !/^(\d)\1+$/.test(rg)
}

// Inscrição Estadual: "ISENTO" ou de 8 a 14 dígitos (o tamanho varia por estado)
export function validarIE(valor) {
  const ie = String(valor ?? '').trim().toUpperCase()
  if (ie === 'ISENTO') return true
  const d = ie.replace(/[.\-\s/]/g, '')
  return /^\d{8,14}$/.test(d) && !/^(\d)\1+$/.test(d)
}

// Placa antiga (ABC1234 / ABC-1234) ou Mercosul (ABC1D23)
export function validarPlaca(valor) {
  const placa = String(valor ?? '').replace(/[-\s]/g, '').toUpperCase()
  return /^[A-Z]{3}\d[A-Z\d]\d{2}$/.test(placa)
}

const ehPF = t => ['PF', 'F'].includes(String(t ?? '').toUpperCase())
const ehPJ = t => ['PJ', 'J'].includes(String(t ?? '').toUpperCase())

// Valida os campos comuns de um cadastro (cliente, fornecedor, transportador...).
// Devolve a primeira mensagem de erro, ou null se estiver tudo certo.
export function validarCadastro(form) {
  const doc = somenteDigitos(form?.cpfCnpj)
  if (doc) {
    if (ehPF(form.tipoPessoa) && !validarCPF(doc)) return 'CPF inválido.'
    if (ehPJ(form.tipoPessoa) && !validarCNPJ(doc)) return 'CNPJ inválido.'
    if (!ehPF(form.tipoPessoa) && !ehPJ(form.tipoPessoa) && !validarCpfCnpj(doc)) return 'CPF/CNPJ inválido.'
  }
  if (form?.email && !validarEmail(form.email)) return 'E-mail inválido.'
  if (form?.cep && !validarCEP(form.cep)) return 'CEP inválido.'
  if (form?.fone && !validarTelefone(form.fone)) return 'Telefone inválido.'
  return null
}
