CREATE TABLE `virgoytAgentAuditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`runId` int,
	`proposalId` int,
	`eventKind` varchar(96) NOT NULL,
	`detailsJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `virgoytAgentAuditEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `virgoytAgentPlanSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int NOT NULL,
	`runId` int NOT NULL,
	`stepOrder` int NOT NULL,
	`title` varchar(240) NOT NULL,
	`description` text,
	`assignedAgent` enum('coding','research','ui','security','devops') NOT NULL,
	`status` enum('pending','in_progress','blocked','complete','skipped') NOT NULL DEFAULT 'pending',
	`requiresApproval` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `virgoytAgentPlanSteps_id` PRIMARY KEY(`id`),
	CONSTRAINT `virgoytPlanStepOrderUnique` UNIQUE(`runId`,`stepOrder`)
);
--> statement-breakpoint
CREATE TABLE `virgoytAgentProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`description` text,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`defaultAgent` enum('coding','research','ui','security','devops') NOT NULL DEFAULT 'coding',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `virgoytAgentProjects_id` PRIMARY KEY(`id`),
	CONSTRAINT `virgoytProjectUserSlugUnique` UNIQUE(`userId`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `virgoytAgentRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int NOT NULL,
	`conversationId` int,
	`agent` enum('coding','research','ui','security','devops') NOT NULL,
	`provider` enum('openrouter','compatible','nvidia_nim','local_bridge') NOT NULL DEFAULT 'openrouter',
	`modelId` varchar(160) NOT NULL DEFAULT 'nvidia/nemotron-3-ultra-550b-a55b',
	`status` enum('queued','planning','waiting_approval','running','succeeded','failed','cancelled','blocked') NOT NULL DEFAULT 'queued',
	`requestSummary` text NOT NULL,
	`outputSummary` text,
	`failureReason` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `virgoytAgentRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `virgoytProviderProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(100) NOT NULL,
	`provider` enum('openrouter','compatible','nvidia_nim','local_bridge') NOT NULL,
	`endpoint` varchar(500),
	`defaultModel` varchar(160),
	`credentialRef` varchar(160),
	`status` enum('unconfigured','ready','disabled','error') NOT NULL DEFAULT 'unconfigured',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `virgoytProviderProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `virgoytProviderUserLabelUnique` UNIQUE(`userId`,`label`)
);
--> statement-breakpoint
CREATE TABLE `virgoytRunnerConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`displayName` varchar(160) NOT NULL,
	`runnerType` enum('local_cli','remote_isolated') NOT NULL,
	`status` enum('pending','paired','active','revoked') NOT NULL DEFAULT 'pending',
	`publicKeyFingerprint` varchar(128),
	`lastSeenAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `virgoytRunnerConnections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `virgoytToolApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`proposalId` int NOT NULL,
	`decision` enum('approved','rejected') NOT NULL,
	`approvalNonce` varchar(96) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `virgoytToolApprovals_id` PRIMARY KEY(`id`),
	CONSTRAINT `virgoytToolApprovals_approvalNonce_unique` UNIQUE(`approvalNonce`),
	CONSTRAINT `virgoytApprovalProposalUnique` UNIQUE(`proposalId`)
);
--> statement-breakpoint
CREATE TABLE `virgoytToolProposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int NOT NULL,
	`runId` int,
	`toolKind` enum('file_write','file_delete','terminal_command','browser_navigate','git_operation','deployment','runner_connect') NOT NULL,
	`riskLevel` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`status` enum('pending','approved','rejected','claimed','executed','failed','expired','blocked') NOT NULL DEFAULT 'pending',
	`title` varchar(240) NOT NULL,
	`payloadDigest` varchar(128) NOT NULL,
	`payloadJson` text NOT NULL,
	`expiresAt` timestamp,
	`resolvedAt` timestamp,
	`executedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `virgoytToolProposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `virgoytAuditUserCreatedIdx` ON `virgoytAgentAuditEvents` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `virgoytAuditProjectCreatedIdx` ON `virgoytAgentAuditEvents` (`projectId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `virgoytPlanStepProjectStatusIdx` ON `virgoytAgentPlanSteps` (`projectId`,`status`,`stepOrder`);--> statement-breakpoint
CREATE INDEX `virgoytProjectUserUpdatedIdx` ON `virgoytAgentProjects` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `virgoytRunUserCreatedIdx` ON `virgoytAgentRuns` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `virgoytRunProjectStatusIdx` ON `virgoytAgentRuns` (`projectId`,`status`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `virgoytProviderUserStatusIdx` ON `virgoytProviderProfiles` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `virgoytRunnerUserStatusIdx` ON `virgoytRunnerConnections` (`userId`,`status`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `virgoytRunnerProjectIdx` ON `virgoytRunnerConnections` (`projectId`);--> statement-breakpoint
CREATE INDEX `virgoytApprovalUserExpiryIdx` ON `virgoytToolApprovals` (`userId`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `virgoytProposalUserStatusIdx` ON `virgoytToolProposals` (`userId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `virgoytProposalProjectStatusIdx` ON `virgoytToolProposals` (`projectId`,`status`,`updatedAt`);