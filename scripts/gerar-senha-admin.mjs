#!/usr/bin/env node
// Gera a entrada de um administrador para a variável ADMIN_USUARIOS.
//
//   node scripts/gerar-senha-admin.mjs email@a3.com.br
//
// A senha é pedida no terminal (sem aparecer na tela) e só o hash é impresso.
// Para vários admins, junte as entradas com vírgula:
//   ADMIN_USUARIOS=ana@a3.com.br:s1.xxx.yyy,joao@a3.com.br:s1.zzz.www
// Use --segredo para gerar também um ADMIN_SESSAO_SEGREDO novo.
import { randomBytes, scrypt } from 'node:crypto'
import { stderr, stdin } from 'node:process'

// Mesmos parâmetros de src/lib/admin/sessao.ts.
const N = 16384
const R = 8
const P = 1
const TAMANHO = 32

const args = process.argv.slice(2)
const email = args.find((a) => !a.startsWith('--'))?.trim().toLowerCase()

if (args.includes('--segredo')) {
  console.log(`ADMIN_SESSAO_SEGREDO=${randomBytes(48).toString('base64url')}`)
  if (!email) process.exit(0)
}

if (!email || !/^[^\s:,]+$/.test(email)) {
  console.error('Uso: node scripts/gerar-senha-admin.mjs <usuario ou email> [--segredo]')
  process.exit(1)
}

function perguntarOculto(pergunta) {
  return new Promise((resolve) => {
    stderr.write(pergunta) // stderr: o stdout fica só com o resultado
    let valor = ''
    if (!stdin.isTTY) {
      // Senha vinda de um pipe: echo "senha" | node scripts/gerar-senha-admin.mjs email
      stdin.setEncoding('utf8')
      stdin.on('data', (parte) => (valor += parte))
      stdin.on('end', () => resolve(valor.split(/\r?\n/)[0]))
      return
    }
    stdin.setRawMode(true)
    stdin.setEncoding('utf8')
    stdin.resume()
    // Colar a senha chega como um bloco só: trata caractere por caractere.
    const aoDigitar = (bloco) => {
      for (const tecla of bloco) {
        if (tecla === '\u0003') process.exit(130) // Ctrl+C
        if (tecla === '\r' || tecla === '\n' || tecla === '\u0004') {
          stdin.setRawMode(false)
          stdin.pause()
          stdin.off('data', aoDigitar)
          stderr.write('\n')
          resolve(valor)
          return
        }
        if (tecla === '\u007f' || tecla === '\b') valor = valor.slice(0, -1)
        else valor += tecla
      }
    }
    stdin.on('data', aoDigitar)
  })
}

const senha = await perguntarOculto('Senha (mínimo 10 caracteres): ')
if (senha.length < 10) {
  console.error('Senha curta demais.')
  process.exit(1)
}
if (stdin.isTTY && (await perguntarOculto('Repita a senha: ')) !== senha) {
  console.error('As senhas não conferem.')
  process.exit(1)
}

const sal = randomBytes(16)
const chave = await new Promise((resolve, reject) =>
  scrypt(senha.normalize('NFKC'), sal, TAMANHO, { N, r: R, p: P }, (erro, k) => (erro ? reject(erro) : resolve(k)))
)
console.log(`${email}:s1.${sal.toString('base64url')}.${chave.toString('base64url')}`)
