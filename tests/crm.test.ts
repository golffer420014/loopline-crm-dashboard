// run: npm test  (node's built-in TS stripping, no test framework)
import assert from 'node:assert/strict'
import { contacts, deals } from '../src/data/crm.ts'
import { changePct, filterContacts, moneyShort, moveDeal, pipelineSummary, relativeDays, sourceBreakdown } from '../src/lib/crm.ts'

const s = pipelineSummary(deals)
assert.equal(s.byStage.reduce((t, x) => t + x.count, 0), deals.length) // every deal lands in one stage
assert.equal(s.openCount, deals.filter(d => !['won', 'lost'].includes(d.stage)).length)
assert.ok(s.weighted < s.openValue && s.weighted > 0) // weighting only discounts
assert.equal(s.winRate, 4 / 6) // 4 won, 2 lost in the demo data

const moved = moveDeal(deals, 'd1', 'won')
assert.equal(moved.find(d => d.id === 'd1')!.stage, 'won')
assert.equal(moved.find(d => d.id === 'd1')!.closeInDays, 0)
assert.equal(moved.length, deals.length)
assert.equal(deals.find(d => d.id === 'd1')!.stage, 'negotiation') // original untouched
assert.equal(pipelineSummary(moved).winRate, 5 / 7)
assert.equal(moveDeal(deals, 'd3', 'proposal').find(d => d.id === 'd3')!.closeInDays, 1) // reopened deal gets a future date

assert.deepEqual(filterContacts(contacts, { q: 'siam' }).map(c => c.id), ['c6'])
assert.ok(filterContacts(contacts, { status: 'at-risk' }).every(c => c.status === 'at-risk'))
assert.equal(filterContacts(contacts, { status: 'all', segment: 'all' }).length, contacts.length)
assert.equal(sourceBreakdown().reduce((t, x) => t + x.count, 0), contacts.length)

assert.equal(moneyShort(1_250_000), '$1.3M')
assert.equal(moneyShort(42000), '$42.0k')
assert.equal(moneyShort(184000), '$184k')
assert.equal(Math.round(changePct([100, 110])), 10)
assert.equal(relativeDays(0), 'today')
assert.equal(relativeDays(45), '2mo ago')
console.log('crm tests passed')
