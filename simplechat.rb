require 'digest/md5'
require 'sinatra'
require 'thread'
require 'json'

CHATLOG = 'simplechat.json'

def touch_chatlog
  save_messages([])
end

$json_mutex = Mutex.new
$read_write_mutex = Mutex.new

def get_messages
	$json_mutex.synchronize do
		JSON.parse(File.open(CHATLOG).read)
	end
end

def save_messages(messages)
	$json_mutex.synchronize do
		File.open(CHATLOG, 'w') do |handle|
			handle.write(messages.to_json)
		end
	end
end

def save_message(message)
	# Need mutex
	$read_write_mutex.synchronize do
		messages = get_messages
		messages << message
		save_messages messages
	end
end

get '/' do
	erb :index
end

post '/' do
	payload = JSON.parse request.body.read

	if !payload.has_key?('name') or
	   !payload.has_key?('message') or
	   payload['name'].length < 1 or
	   payload['name'].length > 10 or
	   payload['message'].length < 1
	   payload['message'].length > 1000
		halt 400
	end

	message = {
		'name' => payload['name'],
		'message' => payload['message'],
		'time' => Time.now.to_i,
		'user_id' => Digest::MD5.hexdigest(request.ip)
	}

	save_message message

	headers 'Content-Type' => 'application/json'
	message.to_json
end

get '/simplechat.json' do
	headers 'Content-Type' => 'application/json'
	{'messages' => get_messages}.to_json
end

# On launch, touch CHATLOG if it does not exist
unless File.exist?(CHATLOG)
  touch_chatlog
end
