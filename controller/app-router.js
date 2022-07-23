const express = require("express");
const { verifyToken } = require("../services/auth_service");
const ytpl = require("ytpl");
const { default: YouTube } = require("youtube-sr");
const ytsr = require("ytsr");
const { getChart, listCharts } = require("billboard-top-100");
const { ARTIST_100, HOT_100 } = require("../constants");
const e = require("express");
const { Playlist } = require("../database/models");

const appRouter = express();
appRouter.use(verifyToken);

appRouter.get("/test", async (req, res) => {
    let url = req.body.url;
    let title = req.body.title;

    const playlist = await ytpl(url);
    res.send({
        // suggest: suggest,
        // search: search,
        // playlist: playlist
    })
})

appRouter.post("/search", async (req, res) => {
    try {
        let searchParam = req.body?.search;
        let limit = req.body?.limit || 50;
        let pages = req?.body?.pages || 2;
        let continuation = req?.body?.continuation;
        let ytsrSearch;
        if (!!continuation) {
            ytsrSearch = await ytsr.continueReq(continuation);
        } else {
            ytsrSearch = await ytsr(searchParam, { limit: limit, pages: pages });
        }
        res.status(200).send(ytsrSearch);
    } catch (error) {
        console.error(error);
        res.status(400).send(error?.message);
    }
})
appRouter.get("/homepage", async (req, res) => {
    try {
        let searchData = await YouTube.homepage()
        res.status(200).send(searchData);
    } catch (error) {
        console.error(error);
        res.status(400).send(error?.message);
    }
})
appRouter.get("/trending", async (req, res) => {
    try {
        let searchData = await YouTube.trending()
        res.status(200).send(searchData);
    } catch (error) {
        console.error(error);
        res.status(400).send(error?.message);
    }
})
// appRouter.get("/billboard/trending", async (req, res) => {
//     let name = req.query.name || "hot-100";
//     let date = req.query.date || new Date().toISOString().slice(0, 10);
//     try {
//         let trendingData = await getChart("artist-100", "2022-07-06", (error, chart) => {
//             res.status(200).send(chart)
//         })
//         // let listData = await listCharts();
//     } catch (error) {
//         console.error(error);
//         res.status(400).send(error?.message)
//     }
// })
const trending = async (name, date) => {
    return new Promise(async (resolve, reject) => {
        await getChart(name, date, (error, chart) => {
            if (error) reject(error);
            resolve(chart);
        })
    })
}
const getAlbums = () => {
    return new Promise(async (resolve, reject) => {
        await listCharts((error, charts) => {
            if (error) reject(error);
            let albums = charts.map(elem => {
                let val = elem?.name?.toLowerCase();
                return val?.includes("album") ? val?.replaceAll("/", " ")?.split(" ").map(elem => {
                    if (elem.includes("_")) {
                        return elem?.split("-")?.map(item => item?.charAt(0)?.toUpperCase() + elem?.slice(1)).join("-");
                    } else {
                        return elem?.charAt(0)?.toUpperCase() + elem?.slice(1)
                    }
                }).join(" ") : null;
            }).filter(elem => !!elem);
            resolve(albums);
        })
    })
}
appRouter.get("/billboard/trending", async (req, res) => {
    let name = req.query.name || HOT_100;
    let date = req.query.date || new Date().toISOString().slice(0, 10);
    let limit = req.query.limit || 20;
    try {
        let artistData = trending(ARTIST_100, date);
        let trendingData = trending(name, date);
        // let albums = getAlbums();
        await Promise.all([artistData, trendingData]).then(([artists, trending]) => {
            res.status(200).send({
                artists: artists.songs.slice(0, limit),
                trending: trending.songs,
                // albums
            })
        });
    } catch (error) {
        console.error(error);
        res.status(400).send(error?.message)
    }
})
appRouter.get("/charts", async (req, res) => {
    try {
        let trendingData = await listCharts((error, chart) => {
            res.status(200).send(chart)
        })
        // let listData = await listCharts();
    } catch (error) {
        console.error(error);
        res.status(400).send(error?.message)
    }
})

appRouter.get("/get-playlists", async (req, res) => {
    try {
        let username = req.query?.username;
        Playlist.find({ username }).select({ _id: 1, title: 1, username: 1, type: 1, createdOn: 1 }).then((resp) => {
            res.status(200).send(resp);
        }).catch(error => {
            console.error(error);
            res.status(400).send(error?.message)
        });
    } catch (error) {
        console.error(error);
        res.status(400).send(error?.message)
    }
})

const processYoutubePlaylist = async (youtubeData, respData) => {
    let playlistReq = youtubeData?.items?.map(item => {
        return {
            id: item?.id,
            title: item?.title,
            author: item?.author?.name,
            url: item?.url,
            thumbnailUrl: item?.bestThumbnail?.url,
            duration: item?.duration
        }
    })
    await Promise.all([playlistReq]);
    respData.playlist = playlistReq;
    return respData;
}

appRouter.get("/get-playlist-data", async (req, res) => {
    try {
        let username = req.query?.username;
        Playlist.findOne({ username, _id: req.query?.id }).then(async (resp) => {
            if (resp?.type === "youtube") {
                let params = new URLSearchParams(new URL(resp?.youtubeUrl)?.search);
                const youtubePlaylist = await ytpl(params.get("list"));
                let processedData = await processYoutubePlaylist(youtubePlaylist, resp);
                res.status(200).send(processedData);
            } else {
                res.status(200).send(resp);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(400).send(error?.message)
    }
})

appRouter.put("/update-playlist", async (req, res) => {
    try {
        let username = req.body?.username;
        let playlistId = req.body?.id;
        if (!playlistId) {
            res.status(400).send("ID missing")
        }
        let updateParams = {};
        let paramCreator = Object.entries(req?.body).filter(([key, value]) => key !== "id" && key !== "username").map(([key, value]) => {
            updateParams[key] = value;
        })
        await Promise.all([paramCreator]);
        Playlist.updateOne({ _id: playlistId }, updateParams).then((resp) => {
            res.status(200).send("Playlist updated successfully")
        }).catch((err) => {
            console.error(err);
            res.status(400).send(err?.message);
        });
    } catch (error) {
        console.error(err);
        res.status(400).send(err?.message);
    }
})

appRouter.post("/create-playlist", async (req, res) => {
    try {
        let playlist = req.body;
        Playlist.create(playlist).then(resp => {
            res.status(201).send("Inserted Successfully")
        }).catch((err) => {
            console.error(err);
            res.status(400).send(err?.message);
        });
    } catch (error) {
        console.error(err);
        res.status(400).send(err?.message);
    }
})



module.exports = appRouter;