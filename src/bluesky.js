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
        const response = await this.agent.getFollows({
            actor, // Replace with your handle
            limit: 100,
            cursor,
        });
    
        // Combine the current page of follows with the accumulated list
        follows.push(...response.data.follows);
    
        // If there's a cursor for the next page, make a recursive call
        if (response.data.cursor) {
            // console.log('getting more');
            return this.getFollows(actor,response.data.cursor, follows);
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
        const response = await this.agent.getFollowers({
          actor, // Replace with your handle
          limit: 100,
          cursor,
        });
    
        // Combine the current page of follows with the accumulated list
        followers.push(...response.data.followers);
    
        // If there's a cursor for the next page, make a recursive call
        if (response.data.cursor) {
            // console.log('getting more');
          return this.getFollowers(actor,response.data.cursor, followers);
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
          const response = await this.agent.app.bsky.graph.getLists({actor})
          if (! response.success) {
              throw new Error("get lists unsuccessful");
          }
          lists = response.data.lists;
          return lists;
        } catch (error) {
          console.error(error.message);
        }
    }

    getList = async (listUri) => {
        // console.log(safelist.uri);
        let cursor;
        let members = [];
        do {
        let res = await this.agent.app.bsky.graph.getList({
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
        await this.agent.com.atproto.repo.deleteRecord({
            collection: 'app.bsky.graph.follow',
            repo,
            rkey,
        });
    }

    follow = async (actorDid) => {
      const response = await this.agent.follow(actorDid);
      if (response.validationStatus == 'valid') {
        return response;
      } else {
        throw new Error(`Error following ${actorDid}`);
      }
    }

    getMostRecentLike = async (actor) => {
        const response = await this.agent.getActorLikes({actor,limit:1});
        if (response.success) {
          return response.data.feed[0].post;
        } else {
          throw new Error("Error getting actor feed");
        }
    }

    getMostRecentPost = async (actor) => {
        const response = await this.agent.getAuthorFeed({actor,limit:1});
        if (response.success) {
          return response.data.feed[0];
        } else {
          throw new Error("Error getting actor feed");
        }
    }

    isActive = async (actor) => {
      const mostRecentPost = await this.getMostRecentPost(actor);
      let active = false;
      let recentActivity
      if (!mostRecentPost) { 
        // Never posted
        return {active};
      } else {
        if (mostRecentPost.reply) {
          active = true;
          recentActivity = 'reply';
        } else if (mostRecentPost.post?.author.handle == actor) {
          active = true;
          recentActivity = 'post';
        } else {
          active = true;
          recentActivity = 'repost';
        }
        console.log(mostRecentPost)
        const activityDate = dayjs(mostRecentPost.post.record.createdAt);
        const postAge = dayjs().diff(activityDate,'weeks')
        // TODO this should be a function argument
        if (postAge > 2) {
          console.log(`${actor} is inactive.`)
          active = false;
        }
        return {active,recentActivity,activityDate:activityDate.toISOString()};
      }
    }

}

module.exports = BlueSkyClient;