import Show from "../models/Show.js";

export function listShows(filters = {}) {
  return Show.find(filters)
    .populate("movie", "title genre duration language posterUrl")
    .sort({ date: 1, time: 1, theatre: 1, screen: 1 })
    .lean();
}

export function findShowById(id) {
  return Show.findById(id).populate("movie", "title genre duration language posterUrl").lean();
}

export function createShow(showData) {
  return Show.create(showData);
}

export function updateShowById(id, showData) {
  const filter = {
    _id: id,
    $expr: {
      $lte: [
        {
          $add: [
            showData.availableSeats ?? "$availableSeats",
            { $size: { $ifNull: ["$bookedSeats", []] } }
          ]
        },
        showData.totalSeats ?? "$totalSeats"
      ]
    }
  };
  const showIdentityFields = ["movie", "date", "time", "theatre", "screen"];
  if (showIdentityFields.some((field) => showData[field] !== undefined)) {
    filter.$expr = {
      $and: [
        filter.$expr,
        { $eq: [{ $size: { $ifNull: ["$bookedSeats", []] } }, 0] }
      ]
    };
  }

  return Show.findOneAndUpdate(filter, { $set: showData }, {
    new: true,
    runValidators: true
  })
    .populate("movie", "title genre duration language posterUrl")
    .lean();
}

export function updateAvailableSeatsById(id, availableSeats) {
  return Show.findOneAndUpdate(
    {
      _id: id,
      $expr: {
        $lte: [
          { $add: [availableSeats, { $size: { $ifNull: ["$bookedSeats", []] } }] },
          "$totalSeats"
        ]
      }
    },
    { $set: { availableSeats } },
    { new: true, runValidators: true }
  )
    .populate("movie", "title genre duration language posterUrl")
    .lean();
}

export function deleteShowById(id) {
  return Show.findOneAndDelete({
    _id: id,
    $expr: { $eq: [{ $size: { $ifNull: ["$bookedSeats", []] } }, 0] }
  }).lean();
}
