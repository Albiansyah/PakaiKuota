-- KEYS[1] = spend key (e.g. spend:userId:hourly)
-- ARGV[1] = amount
-- ARGV[2] = window seconds
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
local limit = tonumber(redis.call('GET', KEYS[1] .. ':limit') or '0')
local amount = tonumber(ARGV[1])

if limit > 0 and (current + amount) > limit then
  return 0
end

local new = redis.call('INCRBY', KEYS[1], amount)
if tonumber(current) == 0 then
  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
end
return 1
