/* eslint-disable no-console */
const dotenv = require('dotenv')
const path = require('path')

dotenv.config()
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const { validateStartupConfig, printStartupValidationReport } = require('../config/startupValidation')

const report = validateStartupConfig()
printStartupValidationReport(report)

if (report.ok) {
  console.log('[startup] environment check passed')
  process.exit(0)
}

console.error('[startup] environment check failed')
process.exit(1)
