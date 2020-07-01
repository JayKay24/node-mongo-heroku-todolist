//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://admin-james:9Lru3F7ParkCtzp@cluster0.4pwq8.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

const Item = mongoose.model("Item", itemSchema);

const buyFood = new Item({ name: "Buy Food" });
const watchMovie = new Item({ name: "Watch Movie" });
const readBook = new Item({ name: "Read Book" });

const defaultItems = [buyFood, watchMovie, readBook];

const listSchema = {
  name: String,
  items: [itemSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, (err, foundItems) => {
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully inserted default items");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list.trim();

  const item = new Item({ name: itemName });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      if (err) {
        console.log(err);
      } else if (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId.trim(), (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully removed the item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName.trim() },
      { $pull: { items: { _id: checkedItemId.trim() } } },
      (err, foundList) => {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: req.params.customListName }, (err, foundList) => {
    const customListName = req.params.customListName;
    if (err) {
      console.log(err);
    } else if (foundList) {
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    } else {
      const list = new List({
        name: customListName,
        items: defaultItems,
      });

      list.save();
      res.redirect("/" + customListName);
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port === null || port === "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server has started successfully");
});
