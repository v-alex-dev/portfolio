#!/usr/bin/env ts-node
import bcrypt from 'bcryptjs'

async function main() {
  const pwd = process.argv[2]
  if (!pwd) {
    console.error('Usage: ts-node scripts/hash-password.ts <PASSWORD>')
    process.exit(1)
  }
  const hash = await bcrypt.hash(pwd, 10)
  console.log(hash)
}

main()
