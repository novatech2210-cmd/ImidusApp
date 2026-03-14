#!/bin/bash
# Fix yarn to pnpm in GitHub Actions workflows
# Run from your repo root: ./fix-yarn-to-pnpm.sh

WORKFLOWS_DIR=".github/workflows"

if [ ! -d "$WORKFLOWS_DIR" ]; then
    echo "Error: .github/workflows directory not found"
    exit 1
fi

cd "$WORKFLOWS_DIR"

echo "Fixing workflows in $PWD..."

for file in *.yml *.yaml; do
    [ -f "$file" ] || continue
    
    echo "Processing: $file"
    
    # Replace yarn commands with pnpm
    sed -i 's/yarn install --frozen-lockfile/pnpm install --frozen-lockfile/g' "$file"
    sed -i 's/yarn install/pnpm install/g' "$file"
    sed -i 's/yarn build/pnpm build/g' "$file"
    sed -i 's/yarn test/pnpm test/g' "$file"
    sed -i 's/yarn start/pnpm start/g' "$file"
    sed -i 's/yarn lint/pnpm lint/g' "$file"
    sed -i "s/cache: 'yarn'/cache: 'pnpm'/g" "$file"
    sed -i 's/cache: "yarn"/cache: "pnpm"/g' "$file"
    
    # Check if pnpm-setup is already present
    if ! grep -q "pnpm/action-setup" "$file"; then
        echo "  ⚠ NOTE: Add pnpm/action-setup step manually to $file"
    fi
done

echo ""
echo "Done! Manual step required:"
echo "Add this after 'actions/checkout' in each workflow:"
echo ""
echo "    - name: Setup pnpm"
echo "      uses: pnpm/action-setup@v2"
echo "      with:"
echo "        version: 8"
echo ""
echo "Also update cache-dependency-path in setup-node:"
echo "    cache-dependency-path: 'mobile/pnpm-lock.yaml'  # or web/pnpm-lock.yaml"
