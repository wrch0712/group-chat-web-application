import sqlite3
import string
import random
from datetime import datetime
from flask import *
from functools import wraps

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

def get_db():
    db = getattr(g, '_database', None)

    if db is None:
        db = g._database = sqlite3.connect('db/watchparty.sqlite3')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    db = get_db()
    cursor = db.execute(query, args)
    rows = cursor.fetchall()
    db.commit()
    cursor.close()
    if rows:
        if one: 
            return rows[0]
        return rows
    return None

def new_user():
    name = "Unnamed User #" + ''.join(random.choices(string.digits, k=6))
    password = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    api_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
    u = query_db('insert into users (name, password, api_key) ' + 
        'values (?, ?, ?) returning id, name, password, api_key',
        (name, password, api_key),
        one=True)
    return u

# TODO: If your app sends users to any other routes, include them here.
#       (This should not be necessary).
@app.route('/')
@app.route('/profile')
@app.route('/login')
@app.route('/room')
@app.route('/rooms/<int:room_id>')
def index(room_id=None, chat_id=None):
    return app.send_static_file('index.html')

@app.errorhandler(404)
def page_not_found(e):
    return app.send_static_file('404.html'), 404



# -------------------------------- API ROUTES ----------------------------------

@app.route('/api/signup/', methods=['GET'])
def signup():
    print("sign up")
    u = new_user()
    return jsonify({'userID': u[0], 'userName': u[1], 'passWord': u[2], 'apiKey': u[3]})


@app.route('/api/login/', methods=['POST'])
def login():
    print("log in")
    loginUsername = request.json['inputUsername']
    loginPassword = request.json['inputPassword']
    u = query_db('select * from users where name = ? and password = ?', [loginUsername, loginPassword], one=True)
    if u != None:
        return jsonify({'result': 'success', 'userID': u[0], 'apiKey': u[3]})
    return jsonify({'result': 'fail'})


@app.route('/api/changeUsername/', methods=['POST'])
def change_username():
    print("change user name")
    apiKey = request.headers.get('API-Key')
    if apiKey and query_db('select * from users where api_key = ?', [apiKey], one=True) != None:
        newUsername = request.json['inputNewUsername']
        query_db('update users set name = ? where api_key = ?', (newUsername, apiKey))
        return {}, 200
    return {}, 404


@app.route('/api/changePassword/', methods=['POST'])
def change_password():
    print("change password")
    apiKey = request.headers.get('API-Key')
    if apiKey and query_db('select * from users where api_key = ?', [apiKey], one=True) != None:
        newPassword = request.json['inputNewPassword']
        query_db('update users set password = ? where api_key = ?', (newPassword, apiKey))
        return {}, 200
    return {}, 404


@app.route('/api/getRooms/', methods=['GET'])
def get_rooms():
    print("get all rooms")
    apiKey = request.headers.get('API-Key')
    if apiKey and query_db('select * from users where api_key = ?', [apiKey], one=True) != None:
        rooms = query_db('select * from rooms')
        if rooms is None: return []
        res = []
        for room in rooms:
            res.append({'roomId': room[0], 'roomName': room[1]})
        return jsonify(res)
    return {}, 404


@app.route('/api/createRoom/', methods=['GET'])
def create_room():
    print("create a room")
    apiKey = request.headers.get('API-Key')
    if apiKey and query_db('select * from users where api_key = ?', [apiKey], one=True) != None:
        r = query_db('insert into rooms (name) values (?) returning id', ['newRoom'], one=True)
        print(r)
        newRoomId = r[0]
        query_db('update rooms set name = ? where id = ?', ('new room ' + str(newRoomId), newRoomId))
        return jsonify({'newRoomID': newRoomId})
    return {}, 404


@app.route('/api/getRoomInfo/<int:room_id>/', methods=['GET'])
def get_roomInfo(room_id):
    apiKey = request.headers.get('API-Key')
    if apiKey and query_db('select * from users where api_key = ?', [apiKey], one=True) != None:
        room = query_db('select * from rooms where id = ?', [room_id], one=True)
        if room != None:
            return jsonify({'roomName': room[1]})
    return {}, 404


@app.route('/api/getMessage/<int:room_id>/', methods=['GET'])
def get_message(room_id):
    apiKey = request.headers.get('API-Key')
    if apiKey and query_db('select * from users where api_key = ?', [apiKey], one=True) != None:
        messages = query_db('select a.id, a.body, b.name from messages a left join users b on a.user_id = b.id where a.room_id = ?', [room_id])
        if messages is None: return []
        res = []
        for m in messages:
            res.append({'id': m[0], 'body': m[1], 'name': m[2]})
        return jsonify(res)
    return {}, 404


@app.route('/api/changeRoomname/', methods=['POST'])
def change_roomName():
    print("change room name")
    apiKey = request.headers.get('API-Key')
    if apiKey and query_db('select * from users where api_key = ?', [apiKey], one=True) != None:
        roomId = request.json['room_id']
        newRoomname = request.json['new_roomname']
        query_db('update rooms set name = ? where id = ?', (newRoomname, roomId))
        return {}, 200
    return {}, 404


@app.route('/api/postMessage/', methods=['POST'])
def post_message():
    print("post message")
    apiKey = request.headers.get('API-Key')
    if apiKey and query_db('select * from users where api_key = ?', [apiKey], one=True) != None:
        userId = request.json['user_id']
        roomId = request.json['room_id']
        newMesssage = request.json['new_message']
        query_db('insert into messages (user_id, room_id, body)' + 
                'values (?, ?, ?)', (userId, roomId, newMesssage), one=True)
        return {}, 200
    return {}, 404

