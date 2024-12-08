const { BskyAgent } = require('@atproto/api');
const dayjs = require('dayjs');


class BlueSkyClient {

    constructor(identifier,password) {
      this.service = 'https://bsky.social';
      this.identifier = identifier;
      this.password = password;     

      this.agent = new BskyAgent({ service: this.service });
    }

    login = async() => {
        try {
          const auth = await this.agent.login({identifier: this.identifier, password: this.password});
          if (auth.success) {
            return auth.data;
          }
        } catch (error) {
          console.error(error.error);
          console.error(`Rate limit resets at ${error.headers['ratelimit-reset']} ${dayjs.unix(error.headers['ratelimit-reset']).format()}`)
        }
    }

     getProfile = async (actor) => {
        const response = await this.agent.getProfile({actor});
        if (response.success) {
          return response.data;
        } else {
          throw new Error("Error getting profile");
        }
      }

    //  ! Consider returning promisess and awaiting Promise.all()
     getFollows = async (actor,cursor = null, follows = []) => {
        try {
        // Make the API call with the optional cursor
        const response = await agent.getFollows({
            actor, // Replace with your handle
            limit: 100,
            cursor,
        });
    
        // Combine the current page of follows with the accumulated list
        follows.push(...response.data.follows);
    
        // If there's a cursor for the next page, make a recursive call
        if (response.data.cursor) {
            // console.log('getting more');
            return getFollows(actor,response.data.cursor, follows);
        }
    
        // Return the complete list of follows once pagination ends
        return follows;
        } catch (error) {
        console.error('Error fetching follows:', error);
        throw error;
        }
    }
  
  //  ! Consider returning promisess and awaiting Promise.all()
     getFollowers = async (actor,cursor = null, followers = []) =>  {
      try {
        // Make the API call with the optional cursor
        const response = await agent.getFollowers({
          actor, // Replace with your handle
          limit: 100,
          cursor,
        });
    
        // Combine the current page of follows with the accumulated list
        followers.push(...response.data.followers);
    
        // If there's a cursor for the next page, make a recursive call
        if (response.data.cursor) {
            // console.log('getting more');
          return getFollowers(actor,response.data.cursor, followers);
        }
    
        // Return the complete list of follows once pagination ends
        return followers;
      } catch (error) {
        console.error('Error fetching followers:', error);
        throw error;
      }
    }

    getLists = async (actor) => {
        let lists
        try {
          const response = await agent.app.bsky.graph.getLists({actor})
          if (! response.success) {
              throw new Error("get lists unsuccessful");
          }
          lists = response.data.lists;
        } catch (error) {
          console.error(error.message);
        }
    }

    getList = async (listUri) => {
        // console.log(safelist.uri);
        let cursor;
        let members = [];
        do {
        let res = await agent.app.bsky.graph.getList({
            list: listUri,
            limit: 30,
            cursor
        })
        cursor = res.data.cursor
        members = members.concat(res.data.items)
        } while (cursor)

        return members;
    }

    unfollow = async (followUri) => {
        const unfollowUri = followUri;
        const [rkey, , repo] = unfollowUri ? unfollowUri.split('/').reverse() : [];
        await agent.com.atproto.repo.deleteRecord({
            collection: 'app.bsky.graph.follow',
            repo,
            rkey,
        });
    }

    getMostRecentLike = async (actor) => {
        const response = await agent.getActorLikes({actor,limit:1});
        if (response.success) {
          return response.data;
        } else {
          throw new Error("Error getting actor feed");
        }
    }

    getMostRecentPost = async (actor) => {
        const response = await agent.getAuthorFeed({actor,limit:1});
        if (response.success) {
          return response.data;
        } else {
          throw new Error("Error getting actor feed");
        }
    }

}

module.exports = BlueSkyClient;