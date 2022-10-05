
# BigShot Protocol

The protocol combines a decentralized exchange and a lending protocol to create a leveraged short position. A short trade is undertaken by an user who speculates that the value of a particular ERC20 token might drop. In a traditional finance short trade the user borrows an asset he doesn't own from someone and sells it in the market. At a later point in time the user buys this asset back from the market and returns it to the rightful owner. In this transaction if the value of the asset had actually dropped then the user would make money by buying it back at a cheaper price than he initially sold it for. The user from which he borrowed would not have any change in his portfolio because of this. The user who had did the short trade would have made a profit. The user would make a loss the same way if the value of the token goes up contrary to his/her expectations. 

The Protocol uses a lending protocol to borrow the tokens we want to short and sell it in the market. It also uses a Dex to to buy and sell ERC20 tokens. The user has to provide some collateral to create a short position. The rest of the collateral required to borrow the required amount of token from the lending protocol would be taken from the Dex through a flash swap. Thus providing the user with leverage on the capital he owns.

### Working of BigShot

When the user initiates a short position we take some collateral from the user. The rest of the collateral required to borrow the required amount of token to short is obtained from the Dex through a flash swap. Once we initiate a flash swap we will have the tokens in our hand and only need to return the flash swap by the end of the transaction. We use the collateral from the flash swap together with the collateral that we got from user in order to borrow the token we wat to short. Once we have the token we can pay back the flash swap with this token. As a result we have lend the short ERC20 token from the lending pool and sold it in the Dex. This way we have created a short position.

When the user closes a short position we initiate a flash swap with the Dex and obtain the shorted token. We pay back the lending protocol with this token and get back the collateral from the lending protocol. We use this collateral to pay back the flash swap. If the value of the asset has gone down with respect to the collateral the user would be able to buy it at a cheaper rate than he initially sold it. There by making a profit. If the value went up the user has to buy it back a higher rate and pay back his loan to the lending protocol. There by making a loss. If the users position goes into too much loss the lending protocol will liquidate his loan automatically. In this way the maximum loss that can come to the user is his initial collateral.

#### Open Short position


![Open Short Position](https://bafybeigxkaueodgnrcfclksidplhebaajm47od3542vxanadp3xsjfjyg4.ipfs.w3s.link/Big%20Shot%20Protocol%20Open%20Short%20Position.png)

#### Close Short Position

![Close Short Position](https://bafybeid7fn2d7vx3rnu26hm5pbeb4bfzmhfoaveb7227iwta5gzee4d37e.ipfs.w3s.link/Big%20Shot%20Close%20Shorting%20Position.png)
