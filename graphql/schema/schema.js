import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json";
import pkg from "graphql-iso-date";
const { GraphQLDateTime } = pkg;

const typeDefs = `#graphql
scalar JSON
scalar GraphQLDateTime

  type User {
    id: Int!
    name: String!
    email: String!
    picture:String
    status:String
    isActive:Boolean
    createdAt : GraphQLDateTime
    messages: [Message]
    conversations:[Conversation]
    token:String
  }
  type Receiver {
    id: Int!
    name: String!
    email: String!
    picture:String
    status:String
    isActive:Boolean
    createdAt : GraphQLDateTime
  }

  type Message {
    id: Int!
    message:String!
    files: JSON
    senderId:Int
    user: User
    conversation:Conversation
  }

  type Conversation {
    id:Int!
    name:String!
    picture:String!
    senderId:Int
    receiverId:Int
    user:User
    message:[Message]
    receiver: User
    isGroup:Boolean
    isAdmin:Boolean
    isActive:Boolean
  }


# ----- Responses send to frontend schema ----

  # ------- Responses for create user ------
  type CreateUserResponses {
    code:Int!
    status:Boolean!
    ack:Int!
    msg:String!
    data:User
  }
  #---- end----
  # ------- Responses for Message ------
    type CreateMessageResponses {
    code:Int!
    status:Boolean!
    ack:Int!
    msg:String!
    data:Message
  }
  
  type SendMessageResponse {
    code:Int!
    status:Boolean!
    ack:Int!
    msg:String!
    message:Message
  }
  #---- end----
    # ------- Responses for Conversation ------
    type CreateConversationResponses {
    code:Int!
    status:Boolean!
    ack:Int!
    msg:String!
    data:Conversation
  }
  #---- end----

 # --  union CustomCreateConversationRes = SendMessageResponse | CreateConversationResponses

# --- all Responses end here ---------

#--------- Input data type for input ----
  #----- Input for create user ---
  input CreateUserInput {
    name:String!
    email:String!
    picture:String
    status:String
    password:String!
    confirmPassword:String!
    isActive:Boolean
  }
#--- user input end -----

  #----- Input for message ---
  input CreateMessageInput {
    conversationId:Int!
    message:String!
    files: JSON
  }
#--- message input end -----

  #----- Input for conversation  ---
  input CreateConversationInput {
    name:String
    picture:String
    senderId:Int!
    receiverId:Int!
    latestMessageId:Int
     isGroup:Boolean!
    isAdmin:Boolean
    isActive:Boolean
   
  }
#--- conversation input end -----


#------------ Query start -------------
  type Query {
    searchUser(searchParam:String) :[User]
    oneUser(id: Int!): User
    allUser: [User!]!
    manyMessage(id: Int!): User
    allMessage: [Message!]!
    oneMessage(id: Int!): Message
    getUserConversation(userId:Int!):Conversation
    getMessage(conversationId:Int!):Message
    

  }
 


  type Mutation {
#- ------------ User section --------
    createUser(input:CreateUserInput!):CreateUserResponses
    updateUser(
      id:Int!
      name:String
      email:String
      picture:String
      status:String
      password:String
      isActive:Boolean
    ):CreateUserResponses
    deleteUser(id:Int!):CreateUserResponses
# ------------ User section end --------
# ------- Message section -----
    createMessage(
     input:CreateMessageInput!
    ): CreateMessageResponses!
  
   sendMessage(input:CreateMessageInput!) :SendMessageResponse!

    updateMessage(
      id: Int!
      message:String!
      files:JSON
    ): CreateMessageResponses

    deleteMessage(id: Int!): CreateMessageResponses!
# -------- Message section end -----

#------ Conversation section -----------
     createOpenConversation(input:CreateConversationInput) : CreateConversationResponses
     updateConversation(
      id:Int!
      name:String
      picture:String
      latestMessageId:Int!
      isGroup:Boolean
      isAdmin:Boolean
      isActive:Boolean
     ): CreateConversationResponses
     deleteConversation(id:Int!): CreateConversationResponses

  
# ---------- conversation section end ---------------

#------ user Log in section ---------
 userSignUp(input:CreateUserInput!):CreateUserResponses
    userSignIn(email: String!,password:String!): User
  }
`;

export default typeDefs;
