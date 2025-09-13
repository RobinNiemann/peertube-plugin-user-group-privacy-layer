# PeerTube plugin: User Group Sharing

## About
This plugin will add a privacy layer that allows very fine-grained privacy settings for every video.
In the Plugin Settings as administrator you can define groups of use names. Every video will then have the option to select any number of groups and the video will then only be accessible to a user if the user is part of any selected group.

## How it works
In the plugin settings (accessible by admins) you can define groups containing user names. The plugin uses a YAML-like structure for that:
```yaml
- group_name: Group 1
  members:
    - user1
    - user2
```

After saving the groups every video will have the options to select the groups to share it with. By default no group is checked so noone can see it.
**Note**: Because of how video plugin settings are registered there is a text field with a JSON array wich is the actual setting but below are the dynamicly created checkboxes. Maybe not ideal but it works.

## Limitations
- If the standard video privacy setting it set to public the video files will be served publicly enen though the video will not appear in the frontend! It's highly recommended to use only the privacy setting "Internal" and maybe even disable the public and unlisted option (see [this plugin](https://www.npmjs.com/package/peertube-plugin-privacy-remover))
- If a video is the first in a playlist it will be visible in the playlists thumbnail. This is a loophole that currently cannot be closed; there is to plugin hook for that. Because of that this plugin will disable the privacy options "Public" and "Unlisted" for playlists so that noone else can cause a privacy leak by adding a video to a playlist. (I mainly developed this plugin for my purposes. If someone wants to use it and dislikes this decision, feel free to create a GitHub issue regarding a feature toggle.)
- If someone had access to a video before and watched it it will continue to show up in the watch history even though it cannot be watched again. (Also currently to Plugin Hook to filter that)

## Development
To quickly update the plugin in the debugging instance run `npm run cli:reinstall`