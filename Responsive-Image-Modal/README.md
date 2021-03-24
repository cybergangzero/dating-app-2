# Responsive-Image-Modal.js
**Responsive-Image-Modal.js** is an
easy to use fully responsive image modal for your websites. It uses
vanilla JavaScript and CSS. No more than 3 lines to get started.

How To Use:
-----------

index.html
 ```html       
<!DOCTYPE html>
<html lang="en">
   <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <title>Document</title>
      <link rel="stylesheet" href="css/modal.css">
   </head>
   <body>
      <div class="img-modal"></div> <!--Create a div for modal -->
      <img src="https://i.pinimg.com/736x/ce/c0/74/cec074ab85ddb1b716c8ea9ed2a79d4f.jpg" alt="">
   </body>
   <script src="js/modal.js"></script><script>
      initModal("img-modal"); //Initialize Modal by class of modal
      addModal(document.querySelectorAll("img")); // Add Modal to Array of Image/Images
   </script>
</html>
```
Functions:
----------

`initModal(className)` : Initialize Modal with parameter as class name
of modal div - call this at the beginning of your script

`addModal(images)` : Call the function with image(s) as a node array.
Preferably use `document.querySelector()`

or `document.querySelectorAll()`

Going to add customizable features soon...

Contributions:
--------------

[Salil Mittal](https://github.com/SalilMittal)
