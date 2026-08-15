CREATE TABLE `jarvisConfirmations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(180) NOT NULL,
	`riskLevel` enum('low','medium','high') NOT NULL DEFAULT 'high',
	`payload` text NOT NULL,
	`status` enum('pending','approved','rejected','executed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `jarvisConfirmations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jarvisConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(180) NOT NULL DEFAULT 'New Jarvis conversation',
	`activeAgent` enum('general','coding','research','files','system','creative') NOT NULL DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jarvisConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jarvisMemories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`category` enum('preference','project','personal','fact','note') NOT NULL DEFAULT 'note',
	`source` enum('manual','conversation') NOT NULL DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jarvisMemories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jarvisMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`agent` varchar(32) NOT NULL DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `jarvisMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jarvisPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`model` varchar(80) NOT NULL DEFAULT 'gpt-5-mini',
	`personality` enum('balanced','concise','strategic','creative') NOT NULL DEFAULT 'balanced',
	`voiceEnabled` int NOT NULL DEFAULT 1,
	`continuousMode` int NOT NULL DEFAULT 0,
	`speechRate` int NOT NULL DEFAULT 100,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jarvisPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `jarvisPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `jarvisTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`notes` text,
	`status` enum('todo','in_progress','done') NOT NULL DEFAULT 'todo',
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`dueAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jarvisTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `jarvisConfirmationUserStatusIdx` ON `jarvisConfirmations` (`userId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `jarvisConversationUserUpdatedIdx` ON `jarvisConversations` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `jarvisMemoryUserUpdatedIdx` ON `jarvisMemories` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `jarvisMessageConversationIdx` ON `jarvisMessages` (`conversationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `jarvisMessageUserIdx` ON `jarvisMessages` (`userId`);--> statement-breakpoint
CREATE INDEX `jarvisTaskUserStatusIdx` ON `jarvisTasks` (`userId`,`status`,`updatedAt`);