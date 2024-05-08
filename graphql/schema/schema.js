const typeDefs = `#graphql
  type User {
    id: Int!
    name: String!
    email: String!
    posts: [Post]!
  }

  type Post {
    id: Int!
    title: String!
    subtitle: String!
    description: String!
    user: User!
  }
  interface Character {
    id: Int!
    name: String!
    email: String!
    Posts: [Post]
  }
  type Users implements Character {
    id: Int!
    name: String!
    email: String!
    Posts: [Post]
  }

  type Query {
    oneUser(id: Int!): User
    allUser: [User!]!
    allPosts: [Post!]!
    onePost(id: Int!): Post
    manyPost(id: Int!): Users
  }

  type Mutation {
    createUser(
      name: String!
      email: String!
      password: String!
      confirmPassword: String!
      isActive: Boolean
    ): User!

    createPost(
      userId: Int!
      title: String!
      subtitle: String!
      description: String!
    ): Post!

    updatePost(
      id: Int!
      title: String
      subtitle: String
      description: String
    ): Post!

    deletePost(id: Int!): Post!

    userLogin(email: String!): User
  }
`;
export default typeDefs;
