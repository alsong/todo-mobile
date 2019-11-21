const express = require('express'),
    graphqlHTTP = require('express-graphql'),
    { buildSchema } = require('graphql'),
    Event = require('./graphql/models/event'),
    User = require('./graphql/models/user'),
    Booking = require('./graphql/models/booking'),
    brcypt = require('bcryptjs'),
    jwt = require('jsonwebtoken'),
    cors = require('cors'),
    mongoose = require('mongoose'),
    app = express()



const singleEvent = async eventId => {
    try {
        const event = await Event.findById(eventId)
        return {
            ...event._doc,
            creator: user.bind(this, event.creator)
        }
    } catch (error) {
        throw error
    }
}

const user = async userId => {
    try {
        const existingUser = await User.findById(userId)
        return { ...existingUser._doc, password: null, createdEvents: events.bind(this, existingUser._doc.createdEvents) }
    }
    catch (err) {
        throw err
    }
}

const events = async eventIds => {
    try {
        return Event.find({ _id: { $in: eventIds } })
            .then(events => {
                return events.map(event => {
                    return { ...event._doc, creator: user.bind(this, event.creator) }
                })
            })
    } catch (error) {
        throw error
    }
}

app.use('/graphql', graphqlHTTP({
    schema: buildSchema(`
        type Booking{
            _id:ID!,
            event: Event!
            user: User!
            createdAt: String!
            updatedAt: String!
        }
        type Event{
            _id:ID!
            title:String!
            description: String!
            price: Float!
            creator: User!
        }
        type User{
            _id:ID!
            email: String!
            password:String
            createdEvents: [Event!]
        }
        type AuthData{
            userId: ID!
            token: String!
            tokenExpiration: Int!
        }
        input UserInput{
            email: String!
            password:String
        }
        input EventInput{
            title:String!
            description: String!
            price: Float!
        }
        type RootQuery{
            events: [Event!]!
            bookings: [Booking!]!
            login(email: String!,password: String!): AuthData!
        }
        type RootMutation{
            createEvent(input: EventInput):Event
            createUser(input: UserInput): User
            bookEvent(eventId: ID!): Booking!
            cancelBooking(bookingId: ID!): Event!
        }
        schema{
            query:RootQuery
            mutation:RootMutation
        }    
        `),
    rootValue: {
        events: () => {
            return Event.find()
                .then(events => {
                    return events.map(event => {
                        return { ...event._doc, creator: user.bind(this, event._doc.creator) }
                    })
                })
        },
        bookings: async () => {
            try {
                const booking = await Booking.find()
                return booking.map(book => {
                    return {
                        ...book._doc,
                        user: user.bind(this, book._doc.user),
                        event: singleEvent.bind(this, book._doc.event),
                        createdAt: new Date(book._doc.createdAt).toISOString(),
                        updatedAt: new Date(book._doc.updatedAt).toISOString()
                    }
                })
            } catch (error) {
                throw error
            }
        },
        bookEvent: async (args) => {
            const fetchedEvent = await Event.findOne({ _id: args.eventId })
            const booking = new Booking({
                user: "5db9b29395fc7414643a4103",
                event: fetchedEvent
            })
            const result = await booking.save()
            return {
                ...result._doc,
                user: user.bind(this, result._doc.user),
                event: singleEvent.bind(this, result._doc.event),
                createdAt: new Date(result._doc.createdAt).toISOString(),
                updatedAt: new Date(result._doc.updatedAt).toISOString()
            }
        },
        login: async ({ email, password }) => {
            const user = await User.findOne({ email: email })
            if (!user) {
                throw new Error('User doesnt exist')
            }
            const isEqual = await brcypt.compare(password, user.password)
            if (!isEqual) {
                throw new Error('Password is incorrect')
            }
            const token = jwt.sign({ userId: user.id, email: user.email }, 'somesupersecretkey', {
                expiresIn: '1h'
            })
            return { userId: user.id, token: token, tokenExpiration: 1 }
        },
        cancelBooking: async (args) => {
            try {
                const booking = await Booking.findById(args.bookingId).populate('event')
                const event = {
                    ...booking.event._doc,
                    creator: user.bind(this, booking.event._doc.creator)
                }
                await Booking.deleteOne({ _id: args.bookingId })
                return event
            } catch (error) {
                throw error
            }
        }
        ,
        createEvent: async (args) => {
            let createdEvent
            try {
                const event = Event({
                    title: args.input.title,
                    description: args.input.description,
                    price: args.input.price,
                    creator: "5db9b29395fc7414643a4103"
                })
                const result = await event.save()
                createdEvent = { ...result._doc }
                const user = await User.findById('5db9b29395fc7414643a4103')
                if (!user) {
                    throw new Error('User doesnt exist')
                }
                user.createdEvents.push(event)
                await user.save()
                return createdEvent
            }
            catch (err) {
                throw err
            }
        },
        createUser: async (args) => {
            try {
                const existingUser = await User.findOne({ email: args.input.email })
                if (existingUser) {
                    throw new Error('User already exists')
                }
                const hashedPassword = await brcypt.hash(args.input.password, 12)
                const user = User({
                    email: args.input.email,
                    password: hashedPassword
                })
                const savedUser = await user.save()
                return { ...savedUser._doc, password: null }
            } catch (error) {
                throw error
            }
        }
    },
    graphiql: true
}))

app.use(cors())

mongoose.connect('mongodb://alsong:test123@ds018839.mlab.com:18839/animatedb', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        const port = process.env.PORT
        app.listen(port, () => { console.log(`Listening to port ${port}`) })
    })
    .catch(err => {
        console.log(err)
    })
