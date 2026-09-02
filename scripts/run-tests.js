import assert from 'node:assert/strict'

function spendLogic(current, amount, limit) {
  if (limit > 0 && current + amount > limit) return 0
  return current + amount
}

function marginFloor(upstream, markup, floor = 1.1) {
  return markup / Math.max(upstream, 1e-12) >= floor
}

function refundEligible(t, role) {
  if (t.status !== 'success') return false
  if (role === 'support' && t.amount > 100000) return false
  return true
}

assert.equal(spendLogic(0, 100, 1000), 100)
assert.equal(spendLogic(950, 100, 1000), 0)
assert.equal(marginFloor(0.00001, 0.000015), true)
assert.equal(marginFloor(0.00001, 0.00001), false)
assert.equal(refundEligible({ status: 'success', amount: 50000 }, 'support'), true)
assert.equal(refundEligible({ status: 'success', amount: 200000 }, 'support'), false)
assert.equal(refundEligible({ status: 'pending', amount: 100 }, 'super_admin'), false)

console.log('OK: spend + margin + refund tests passed')
