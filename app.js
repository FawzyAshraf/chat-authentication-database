import express from 'express';
//import { createClient } from 'redis';

const app = express();


import { createServer } from 'http';
import path from "path";
import { Server } from 'socket.io';
import User from './schema';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser'


import mongoose from 'mongoose';
const uri = "mongodb+srv://Fawzy:fawzy@cluster0.83grs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {console.log("Connected to MongoDB")})
    .catch(err => {console.log(err)});


const server = createServer(app);
const io = new Server(server);
const __dirname = path.resolve();
let prevMessages = [];

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.get('/', (req, res) => {
       if (req.cookies['username'])     //replace with tokens later
           res.sendFile(path.join(__dirname, 'chat.html'));
      else
        res.sendFile(__dirname + '/index.html');
});

app.get('/login', (req, res) => {
      res.sendFile(__dirname + '/login.html');
});

app.post('/login', async(req, res) => {
  const { username, password } = req.body;
  let user = await User.findOne({ username: username });
  if (!user) {
    res.status(400).send('Username doesn\'t exist');
  }
  else{
    const success = await bcrypt.compare(password, user.password);
    if (!success) {
      res.status(400).send('Password is incorrect');
    }
    else{
      res.cookie('username', username);    //replace with tokens later
      res.redirect('/');
    }
  }
})

app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/signup.html');
});

app.post('/signup', async(req, res) => {
  const { username, password } = req.body;
  let user = await User.findOne({ username: username });
  if (user) {
    res.status(400).send('User already exists');
  }
  else{
    const encryptedPassword = await bcrypt.hash(password, 10);
    user = User({ username: username, password: encryptedPassword });
    await user.save();

    res.cookie('username', username);   //replace with tokens later
    res.redirect('/');
  }
  
})

app.post('/prev', async(req, res) => {
  let user = await User.findOne({ username: req.cookies['username'] });
  const messages = user.comments
  res.write("<html><ul>")
  messages.forEach(message => res.write(`<li>${message}</li>`))
  res.write("</ul></html>")
  res.end()
})




io.on('connection', socket=>{
    // (async () => {
    //     const client = createClient();
      
    //     client.on('error', (err) => console.log('Redis Client Error', err));
      
    //     await client.connect();
    //     prevMessages = await client.lRange('messages', 0, -1)
    //     socket.emit('getPrev', prevMessages);
    //   })();
      
    socket.on('chat message', async(msg, username)=>{
        const message = username + ": " + msg;
        // (async () => {
        //     const client = createClient();
          
        //     client.on('error', (err) => console.log('Redis Client Error', err));
        //     await client.connect();
        //     await client.rPush('messages', message)
        //   })(); 
        io.emit('chat message', message);
        const user = await User.findOne({ username: username });
        await user.comments.push(msg);
        await user.save();
    })

})



server.listen(4000, () => { 
     console.log('listening on *:4000');
});

