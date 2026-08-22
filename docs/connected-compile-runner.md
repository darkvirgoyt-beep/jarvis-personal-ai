# Connected Compile Runner

Jarvis can now execute **approved, fixed compilation jobs** through a paired private worker. This is different from a text-only build plan: after a runner is paired and a compile proposal is approved, the worker claims the job, runs the approved build recipe, and reports a redacted result back to the private VirgoYT workspace.

## Supported build recipes

| Target | Fixed recipe | Notes |
| --- | --- | --- |
| Web app | `pnpm install --frozen-lockfile`, `pnpm test -- --run`, `pnpm build` | Runs inside the approved project directory only. |
| Service | `pnpm install --frozen-lockfile`, `pnpm test -- --run`, `pnpm build` | Uses the same Node project safeguards as a web app. |
| Android debug build | `./gradlew assembleDebug` | Requires an existing `gradlew`; release signing is not available. |

> The worker never accepts a chat-supplied shell command. It only executes the server-issued fixed recipe for a proposal that the workspace owner has approved.

## Pair a private runner

1. In **VirgoYT → Settings**, create a runner registration for a private project.
2. Copy the one-time pairing command shown in the protected workspace notice. The service stores only a hash of the pairing token.
3. On a private Ubuntu server, local Linux/macOS machine, Windows subsystem for Linux, or Kali-compatible isolated VM where Node and the project tooling are already installed, run the pairing command from a clone of this repository.
4. Start a worker from the repository root, supplying a trusted workspace root:

```bash
node scripts/virgoyt-cli.mjs work \
  --api-url https://your-jarvis-domain.example \
  --runner-id YOUR_RUNNER_ID \
  --token YOUR_ONE_TIME_PAIRING_TOKEN \
  --workspace-root /srv/jarvis-workspaces
```

The worker sends a heartbeat, claims at most one approved compile job, runs the fixed recipe with shell interpolation disabled, reports a redacted result, and exits. A supervised private runner may invoke this command periodically. For persistent remote operation, use an isolated Ubuntu VM or container service you control; do not expose the pairing token, workspace directory, or runner port publicly.

## Stage and approve a compile job

1. Select a private project and open **VirgoYT → Terminal**.
2. Select the target type and provide a project directory **relative to the configured workspace root**.
3. Select **Stage compile**. Jarvis creates a time-bounded, private proposal rather than executing immediately.
4. Review the proposal in the approval queue, then select **Approve**.
5. A paired active runner may claim the approved job and report `succeeded` or `failed`, with sanitized build output in the audit history.

## Security boundaries

- Pairing tokens are one-time and only their hash is stored server-side.
- A runner can claim only approved fixed build recipes for its own private project scope.
- Workspace paths are constrained below the local `--workspace-root` argument.
- Build output is redacted and length-limited before it is sent back to the control plane.
- The workflow does **not** accept arbitrary commands, browser sessions, passwords, API keys, signing keys, store uploads, deployment credentials, release signing, or automatic publishing.
- Signing and publishing remain separate high-risk actions that require independent user approval and explicitly connected credentials.
