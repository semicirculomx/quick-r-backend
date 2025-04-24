import { connect } from "mongoose";

connect('mongodb+srv://dringoappmx:Er9gRNaQVHezDdat@cluster0.0nabd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log("connected to db"))
    .catch((err) => console.log(err))