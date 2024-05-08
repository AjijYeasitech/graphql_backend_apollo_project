// manyPost 
// using fragment
query manyPost(  $oneUserId: Int!) {
    manyPost(id: $oneUserId) {
     ...UsersField
    }
 
}


fragment UsersField on Users {
  name
  email
  Posts {
    title
    subtitle
    
  }
}

// fragment end
