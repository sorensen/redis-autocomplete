-- Autocomplete destroy
local prefix = ARGV[1]
local keys = redis.call('KEYS', prefix..'*')
local i = 1
local resp = 0
local tmp = {}
-- Since the result of the KEYS call may be large enough
-- to cause an overflow in lua, we will only send a DEL
-- command with 500 keys at the most to prevent crashes
while i <= #keys do
  tmp[#tmp + 1] = keys[i]
  i = i + 1
  if (#tmp % 500 == 0) then
    resp = resp + redis.call('DEL', unpack(tmp))
    tmp = {}
  end
end
resp = resp + redis.call('DEL', unpack(tmp))
return resp