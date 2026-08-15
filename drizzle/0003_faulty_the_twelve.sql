ALTER TABLE `jarvisPreferences` ADD `voiceName` varchar(240);--> statement-breakpoint
ALTER TABLE `jarvisPreferences` ADD `privacyMode` enum('standard','minimal') DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `jarvisPreferences` ADD `visualMode` enum('hud','reduced_motion') DEFAULT 'hud' NOT NULL;--> statement-breakpoint
ALTER TABLE `jarvisPreferences` ADD `pluginSettings` text;